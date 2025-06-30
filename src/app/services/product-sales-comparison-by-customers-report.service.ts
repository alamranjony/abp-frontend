import { Injectable, OnDestroy } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ToasterService } from '@abp/ng.theme.shared';
import {
  FilterPagedAndSortedOrderControlListResultRequestDto,
  ProductSalesComparisonsByCustomerReportDto,
  SubOrderControlListDto,
} from '@proxy/orders';
import { LocalizationService } from '@abp/ng.core';
import {
  REPORT_FONT_FILE_NAME,
  REPORT_FONT_NAME,
  REPORT_FONT_TYPE,
  REPORT_HEADER_BACKGROUND_COLOR,
  REPORT_HEADER_TEXT_COLOR,
  ROUNDING_PRECISION,
} from '../shared/constants';
import { DateRangeType } from '../models/date-range-type';
import trebucFont from 'src/assets/fonts/trebuc-normal.js';
import { getDateFromDateTime } from '../shared/date-time-utils';
import { ReportCategory, SalesComparisonsReportService } from '@proxy/reports';
import { formatFilterItem } from './reports/reports-utils';

@Injectable({
  providedIn: 'root',
})
export class ProductSalesComparisonByCustomersReportService implements OnDestroy {
  private readonly logoUrl = 'assets/images/logo/ffc-logo.jpg';
  destroy$: Subject<void> = new Subject();
  reportData: ProductSalesComparisonsByCustomerReportDto;
  firstDateRange: DateRangeType;
  secondDateRange: DateRangeType;
  readonly reportConfig = {
    imageX: 123,
    imageY: 10,
    imageWidth: 50,
    imageHeight: 20,
    tableFontSize: 10,
    tableCellPadding: 2,
    reportTitleFontSize: 18,
    reportTitleX: 148.5,
    reportTitleY: 40,
    tableStartY: 56,
  };
  selectedStoreNames: string[] = [];
  selectedProductNames: string[] = [];
  selectedProductTypeNames: string[] = [];
  selectedProductDepartmentNames: string[] = [];
  selectedClassNames: string[] = [];
  reportCategory: ReportCategory;

  constructor(
    private http: HttpClient,
    private toasterService: ToasterService,
    private salesComparisonsReportService: SalesComparisonsReportService,
    private readonly localizationService: LocalizationService,
  ) {}

  generateReport(
    input: FilterPagedAndSortedOrderControlListResultRequestDto,
    firstDateRange: any,
    secondDateRange: any,
    selectedClassNames: string[],
    selectedStoreNames: string[],
    selectedProductNames: string[],
    selectedProductDepartmentNames: string[],
    selectedProductTypeName: string[],
    reportCategory: ReportCategory,
  ) {
    this.firstDateRange = firstDateRange;
    this.secondDateRange = secondDateRange;
    this.selectedClassNames = selectedClassNames;
    this.selectedStoreNames = selectedStoreNames;
    this.selectedProductDepartmentNames = selectedProductDepartmentNames;
    this.selectedProductTypeNames = selectedProductTypeName;
    this.selectedProductNames = selectedProductNames;
    this.reportCategory = reportCategory;

    forkJoin([
      this.salesComparisonsReportService.generateProductSalesComparisonByCustomerReport(input),
      this.http.get(this.logoUrl, { responseType: 'blob' }),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([response, logoBlob]) => {
        this.reportData = response;
        if (!response || response.orders.length === 0) {
          this.toasterService.warn('::CustomerProductAnalysisReport:NotFound');
          return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(logoBlob);
        reader.onloadend = () => {
          const logoBase64 = reader.result as string;
          this.generateProductSalesComparisonByCustomersReportPdf(response, logoBase64);
        };
      });
  }

  private generateProductSalesComparisonByCustomersReportPdf(
    reportData: ProductSalesComparisonsByCustomerReportDto,
    logoBase64: string,
  ): void {
    const doc = new jsPDF({ orientation: 'landscape' });

    doc.addFileToVFS(REPORT_FONT_FILE_NAME, trebucFont);
    doc.addFont(REPORT_FONT_FILE_NAME, REPORT_FONT_NAME, REPORT_FONT_TYPE);
    doc.setFont(REPORT_FONT_NAME, REPORT_FONT_TYPE);

    const currentTime = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    if (this.reportCategory === ReportCategory.Summary) {
      const reportBody = this.getReportBody(reportData.orders);
      this.addCustomerSales(reportData, reportBody);
      this.addReportContents(doc, reportBody, logoBase64, currentTime, true);
    }

    if (this.reportCategory === ReportCategory.Details) {
      let locationTotal = {
        firstTotalUnitPrice: 0,
        firstTotalUnits: 0,
        secondTotalUnits: 0,
        secondTotalUnitPrice: 0,
      };

      const customerOrderEntries = Object.entries(this.groupOrdersByCustomers(reportData.orders));
      const totalEntries = customerOrderEntries.length;
      customerOrderEntries.forEach(([customer, customerOrders], index) => {
        const reportBody = this.getReportBody(customerOrders);
        this.calculateLocationTotals(reportBody, locationTotal);

        if (index === totalEntries - 1) {
          this.addLocationTotal(
            locationTotal.firstTotalUnits,
            locationTotal.firstTotalUnitPrice,
            locationTotal.secondTotalUnits,
            locationTotal.secondTotalUnitPrice,
            reportBody,
            null,
            true,
          );
          this.addCustomerSales(reportData, reportBody);
        }

        this.addReportContents(
          doc,
          reportBody,
          logoBase64,
          currentTime,
          index === totalEntries - 1,
          customer,
        );

        if (index < totalEntries - 1) {
          doc.addPage();
        }
      });
    }

    let fileName =
      this.reportCategory === ReportCategory.Summary
        ? this.localizationService.instant(
            '::Reports:ProductSalesComparisonByCustomer:Summary:DownloadableFileName',
          )
        : this.localizationService.instant(
            '::Reports:ProductSalesComparisonByCustomer:Details:DownloadableFileName',
          );
    doc.save(fileName);
  }

  private calculateLocationTotals(
    reportBody: (string | number)[][],
    locationTotal: {
      firstTotalUnitPrice: number;
      firstTotalUnits: number;
      secondTotalUnits: number;
      secondTotalUnitPrice: number;
    },
  ) {
    let totalEntries = reportBody.length;
    reportBody.forEach((row, index) => {
      if (index === totalEntries - 1) return;

      locationTotal.firstTotalUnitPrice += parseFloat(row[2] as string);
      locationTotal.firstTotalUnits += parseFloat(row[3] as string);
      locationTotal.secondTotalUnitPrice += parseFloat(row[5] as string);
      locationTotal.secondTotalUnits += parseFloat(row[6] as string);
    });
  }

  private addReportContents(
    doc: jsPDF,
    body: any,
    logoBase64: string,
    currentTime: string,
    hasCustomerSalesData: boolean,
    customerName?: string,
  ) {
    const reportName = this.localizationService.instant(
      '::Reports:ProductSalesComparisonByCustomer:ReportName',
    );
    const noCustomerText = this.localizationService.instant(
      '::Reports:ProductSalesComparisonByCustomer:NoCustomer',
    );

    const { firstHeaderRow, secondHeaderRow } = this.getTableHeaders();

    const formattedBody = hasCustomerSalesData
      ? [
          ...body.slice(0, -2).map(row => this.formatBodyRow(row, false)),
          ...body.slice(-2).map(row => this.formatBodyRow(row, true)),
        ]
      : [...body.map(row => this.formatBodyRow(row, false))];

    const offSet = this.reportCategory === ReportCategory.Details ? 42 : 35;
    const mainTableY = this.reportConfig.tableStartY + offSet;
    if (this.reportCategory === ReportCategory.Details) {
      doc.setFontSize(14);
      doc.text(customerName || noCustomerText, 14, mainTableY - 5);
    }

    autoTable(doc, {
      startY: mainTableY,
      head: [firstHeaderRow, secondHeaderRow],
      body: formattedBody,
      styles: {
        fontSize: this.reportConfig.tableFontSize,
        cellPadding: this.reportConfig.tableCellPadding,
      },
      headStyles: {
        halign: 'center',
        font: REPORT_FONT_NAME,
        fontStyle: REPORT_FONT_TYPE,
        fillColor: REPORT_HEADER_BACKGROUND_COLOR,
        textColor: REPORT_HEADER_TEXT_COLOR,
      },
      bodyStyles: { halign: 'center', font: REPORT_FONT_NAME, fontStyle: REPORT_FONT_TYPE },
      margin: { top: mainTableY },
      didDrawPage: data => {
        this.addPageHeader(doc, logoBase64, currentTime, data.pageNumber, reportName);

        const filterBody = this.getFilterTableBody();
        this.addFilterTable(doc, filterBody);
      },
    });
  }

  private getTableHeaders(): { firstHeaderRow: any[]; secondHeaderRow: string[] } {
    const localizedText = {
      customer: this.localizationService.instant(
        '::Reports:ProductSalesComparisonByCustomer:Customer',
      ),
      salesAmount: this.localizationService.instant(
        '::Reports:ProductSalesComparisons:SalesAmount',
      ),
      units: this.localizationService.instant('::Reports:ProductSalesComparisons:Units'),
      avg: this.localizationService.instant('::Reports:ProductSalesComparisons:Avg'),
      dev: this.localizationService.instant('::Reports:ProductSalesComparisons:Dev'),
      salesDevAmt: this.localizationService.instant(
        '::Reports:ProductSalesComparisons:SalesDevAmt',
      ),
      reportName: this.localizationService.instant(
        '::Reports:ProductSalesComparisonByCustomer:ReportName',
      ),
      difference: this.localizationService.instant('::Reports:ProductSalesComparisons:Difference'),
      productInfo: this.localizationService.instant(
        '::Reports:ProductSalesByOrderPlacement:ProductInfo',
      ),
      productCodeColumnName: this.localizationService.instant(
        '::Reports:ProductRankingReport:ProductCode',
      ),
      productDescriptionColumnName: this.localizationService.instant(
        '::Reports:ProductRankingReport:ProductDescription',
      ),
    };

    const firstSelectedDateInfo = this.formatDateRange(
      this.firstDateRange.fromDate,
      this.firstDateRange.toDate,
    );
    const secondSelectedDateInfo = this.formatDateRange(
      this.secondDateRange.fromDate,
      this.secondDateRange.toDate,
    );

    const firstHeaderRow =
      this.reportCategory === ReportCategory.Summary
        ? [
            { content: localizedText.customer, colSpan: 1 },
            { content: firstSelectedDateInfo, colSpan: 3 },
            { content: '' },
            { content: secondSelectedDateInfo, colSpan: 3 },
            { content: '' },
            { content: localizedText.difference, colSpan: 3 },
          ]
        : [
            { content: localizedText.productInfo, colSpan: 2 },
            { content: firstSelectedDateInfo, colSpan: 3 },
            { content: '' },
            { content: secondSelectedDateInfo, colSpan: 3 },
            { content: '' },
            { content: localizedText.difference, colSpan: 3 },
          ];

    const secondHeaderRow =
      this.reportCategory === ReportCategory.Summary
        ? [
            '',
            localizedText.salesAmount,
            localizedText.units,
            localizedText.avg,
            '',
            localizedText.salesAmount,
            localizedText.units,
            localizedText.avg,
            '',
            localizedText.salesDevAmt,
            localizedText.units,
            localizedText.dev,
          ]
        : [
            localizedText.productCodeColumnName,
            localizedText.productDescriptionColumnName,
            localizedText.salesAmount,
            localizedText.units,
            localizedText.avg,
            '',
            localizedText.salesAmount,
            localizedText.units,
            localizedText.avg,
            '',
            localizedText.salesDevAmt,
            localizedText.units,
            localizedText.dev,
          ];

    return { firstHeaderRow, secondHeaderRow };
  }

  formatBodyRow(row: any[], isSummary: boolean) {
    return isSummary
      ? [
          row[0],
          `$${row[1]}`,
          row[2],
          `${row[3]}%`,
          '',
          `$${row[4]}`,
          row[5],
          `${row[6]}%`,
          '',
          '',
          '',
          '',
        ]
      : this.reportCategory === ReportCategory.Summary
        ? [
            row[0],
            `$${row[1]}`,
            row[2],
            `$${row[3]}`,
            '',
            `$${row[4]}`,
            row[5],
            `$${row[6]}`,
            '',
            `$${row[7]}`,
            row[8],
            `${row[9]}%`,
          ]
        : [
            row[0],
            row[1],
            `$${row[2]}`,
            row[3],
            `$${row[4]}`,
            '',
            `$${row[5]}`,
            row[6],
            `$${row[7]}`,
            '',
            `$${row[8]}`,
            row[9],
            `${row[10]}%`,
          ];
  }

  formatDateRange(fromDate: Date, toDate: Date) {
    return fromDate && toDate ? `${this.formatDate(fromDate)} To ${this.formatDate(toDate)}` : '';
  }

  private formatDate(date: Date) {
    return date ? new Date(date).toLocaleDateString() : '';
  }

  private addLogo(doc: jsPDF, logoBase64: string, headerTitle: string): void {
    doc.addImage(
      logoBase64,
      'jpg',
      this.reportConfig.imageX,
      this.reportConfig.imageY,
      this.reportConfig.imageWidth,
      this.reportConfig.imageHeight,
    );
    doc.setFontSize(this.reportConfig.reportTitleFontSize);
    doc.text(headerTitle, this.reportConfig.reportTitleX, this.reportConfig.reportTitleY, {
      align: 'center',
    });

    doc.setFontSize(14);
    const byDelDate = this.localizationService.instant(
      '::Reports:ProductSalesComparisons:ByDelDate',
    );
    doc.text(byDelDate, 148.5, 50, { align: 'center' });
  }

  private addPageHeader(
    doc: jsPDF,
    logoBase64: string,
    currentTime: string,
    pageNumber: number,
    headerTitle: string,
  ): void {
    this.addLogo(doc, logoBase64, headerTitle);

    const pageWidth = doc.internal.pageSize.getWidth();
    const marginRight = 15;
    doc.setFontSize(10);
    const pageInfoTemplate = this.localizationService.instant('::Reports:Common:PageInfo');
    const pageInfoText = pageInfoTemplate
      .replace('{0}', currentTime)
      .replace('{1}', pageNumber.toString());
    doc.text(pageInfoText, pageWidth - marginRight, 15, {
      align: 'right',
    });
  }

  private groupOrdersByCustomers(orders: SubOrderControlListDto[]): {
    [key: string]: SubOrderControlListDto[];
  } {
    return orders.reduce(
      (groupedOrders, order) => {
        const customerId = order.customerId ?? '';
        const customerName = order.customerName || '';
        const key = customerId || customerName ? `${customerId} : ${customerName}` : '';

        groupedOrders[key] = groupedOrders[key] || [];
        groupedOrders[key].push(order);
        return groupedOrders;
      },
      {} as { [key: string]: SubOrderControlListDto[] },
    );
  }

  private getReportBody(orders: SubOrderControlListDto[]) {
    const firstSetOrders = this.filterAndGroupOrders(orders, this.firstDateRange);
    const secondSetOrders = this.filterAndGroupOrders(orders, this.secondDateRange);

    const finalGroupOrders = orders.reduce<Record<string, SubOrderControlListDto>>(
      (grouped, order) => {
        const key = this.getGroupedKey(order);

        if (!grouped[key]) {
          grouped[key] = { ...order };
        } else {
          grouped[key].totalUnitPrice += order.totalUnitPrice;
          grouped[key].totalUnits += order.totalUnits;
          grouped[key].avgUnitPrice = grouped[key].totalUnitPrice / grouped[key].totalUnits;
        }

        return grouped;
      },
      {},
    );

    let totalFirstUnits = 0;
    let totalFirstUnitPrice = 0;
    let totalSecondUnits = 0;
    let totalSecondUnitPrice = 0;

    const noCustomerText = this.localizationService.instant(
      '::Reports:ProductSalesComparisonByCustomer:NoCustomer',
    );

    const bodyContents = Object.entries(finalGroupOrders).map(([key, orderInfo]) => {
      const isSummaryReport = this.reportCategory === ReportCategory.Summary;
      const groupingKey = this.getGroupedKey(orderInfo);

      const firstSet = firstSetOrders[groupingKey] || {
        totalUnits: 0,
        totalUnitPrice: 0,
        avgUnitPrice: 0,
      };
      const secondSet = secondSetOrders[groupingKey] || {
        totalUnits: 0,
        totalUnitPrice: 0,
        avgUnitPrice: 0,
      };

      totalFirstUnits += firstSet.totalUnits;
      totalFirstUnitPrice += firstSet.totalUnitPrice;
      totalSecondUnits += secondSet.totalUnits;
      totalSecondUnitPrice += secondSet.totalUnitPrice;

      const diffUnits = firstSet.totalUnits - secondSet.totalUnits;
      const diffUnitPrice = firstSet.totalUnitPrice - secondSet.totalUnitPrice;
      const diffAvgPrice = firstSet.totalUnitPrice
        ? (diffUnitPrice / firstSet.totalUnitPrice) * 100
        : diffUnitPrice !== 0
          ? -100
          : 0;

      const customerName = orderInfo?.customerId
        ? `${orderInfo?.customerId} - ${orderInfo?.customerName || ''}`
        : noCustomerText;

      return isSummaryReport
        ? [
            customerName,
            firstSet.totalUnitPrice.toFixed(ROUNDING_PRECISION),
            firstSet.totalUnits,
            firstSet.avgUnitPrice.toFixed(ROUNDING_PRECISION),
            secondSet.totalUnitPrice.toFixed(ROUNDING_PRECISION),
            secondSet.totalUnits,
            secondSet.avgUnitPrice.toFixed(ROUNDING_PRECISION),
            diffUnitPrice.toFixed(ROUNDING_PRECISION),
            diffUnits,
            diffAvgPrice.toFixed(1),
          ]
        : [
            orderInfo?.productCode || '',
            orderInfo?.productDescription || '',
            firstSet.totalUnitPrice.toFixed(ROUNDING_PRECISION),
            firstSet.totalUnits,
            firstSet.avgUnitPrice.toFixed(ROUNDING_PRECISION),
            secondSet.totalUnitPrice.toFixed(ROUNDING_PRECISION),
            secondSet.totalUnits,
            secondSet.avgUnitPrice.toFixed(ROUNDING_PRECISION),
            diffUnitPrice.toFixed(ROUNDING_PRECISION),
            diffUnits,
            diffAvgPrice.toFixed(1),
          ];
    });

    const orderInfo = orders[0];
    const customerName = orderInfo?.customerId
      ? `${orderInfo.customerId} - ${orderInfo.customerName || ''}`
      : '';

    this.addLocationTotal(
      totalFirstUnits,
      totalFirstUnitPrice,
      totalSecondUnits,
      totalSecondUnitPrice,
      bodyContents,
      customerName,
    );

    return bodyContents;
  }

  private addLocationTotal(
    firstTotalUnits: number,
    firstTotalUnitPrice: number,
    secondTotalUnits: number,
    secondTotalUnitPrice: number,
    bodyContents: any[],
    customerInfo?: string,
    isGrandTotal: boolean = false,
  ) {
    const locationTotalTextTemplate = this.localizationService.instant(
      '::Reports:ProductSalesComparisonByCustomer:SubTotals',
    );
    const noCustomerText = this.localizationService.instant(
      '::Reports:ProductSalesComparisonByCustomer:NoCustomer',
    );

    const customerName = customerInfo ? `***  ${customerInfo}  TOTALS ***` : noCustomerText;
    const locationTotalText =
      this.reportCategory === ReportCategory.Summary ? locationTotalTextTemplate : customerName;

    const avgFirstUnitPrice = firstTotalUnits ? firstTotalUnitPrice / firstTotalUnits : 0;
    const avgSecondUnitPrice = secondTotalUnits ? secondTotalUnitPrice / secondTotalUnits : 0;

    const diffTotalUnits = firstTotalUnits - secondTotalUnits;
    const diffTotalUnitPrice = firstTotalUnitPrice - secondTotalUnitPrice;
    const diffAvgUnitPrice = firstTotalUnitPrice
      ? (diffTotalUnitPrice / firstTotalUnitPrice) * 100
      : diffTotalUnitPrice !== 0
        ? -100
        : 0;

    let locationText = [
      !isGrandTotal ? locationTotalText : locationTotalTextTemplate,
      firstTotalUnitPrice.toFixed(ROUNDING_PRECISION),
      firstTotalUnits,
      avgFirstUnitPrice.toFixed(ROUNDING_PRECISION),
      secondTotalUnitPrice.toFixed(ROUNDING_PRECISION),
      secondTotalUnits,
      avgSecondUnitPrice.toFixed(ROUNDING_PRECISION),
      diffTotalUnitPrice.toFixed(ROUNDING_PRECISION),
      diffTotalUnits,
      diffAvgUnitPrice.toFixed(1),
    ];

    if (this.reportCategory === ReportCategory.Details) {
      locationText.unshift('');
    }

    bodyContents.push(locationText);
  }

  private addCustomerSales(reportData: any, bodyContents: any[]) {
    const [newCustomerSalesFirst, newCustomerSalesSecond] = [
      this.FilterAndAccumulate(reportData.newCustomerSales, this.firstDateRange),
      this.FilterAndAccumulate(reportData.newCustomerSales, this.secondDateRange),
    ];

    const [existingCustomerSalesFirst, existingCustomerSalesSecond] = [
      this.FilterAndAccumulate(reportData.existingCustomerSales, this.firstDateRange),
      this.FilterAndAccumulate(reportData.existingCustomerSales, this.secondDateRange),
    ];

    const newCustomerFirstDiff = this.calculateDiffAvgUnitPrice(newCustomerSalesFirst);
    const newCustomerSecondDiff = this.calculateDiffAvgUnitPrice(newCustomerSalesSecond);
    const existingCustomerFirstDiff = this.calculateDiffAvgUnitPrice(existingCustomerSalesFirst);
    const existingCustomerSecondDiff = this.calculateDiffAvgUnitPrice(existingCustomerSalesSecond);

    const newCustomerText = this.localizationService.instant(
      '::Reports:ProductSalesComparisonByCustomer:NewCustomers',
    );
    this.pushCustomerSalesRow(
      newCustomerText,
      newCustomerSalesFirst,
      newCustomerSalesSecond,
      newCustomerFirstDiff,
      newCustomerSecondDiff,
      bodyContents,
    );

    const existingCustomerText = this.localizationService.instant(
      '::Reports:ProductSalesComparisonByCustomer:ExistingCustomers',
    );
    this.pushCustomerSalesRow(
      existingCustomerText,
      existingCustomerSalesFirst,
      existingCustomerSalesSecond,
      existingCustomerFirstDiff,
      existingCustomerSecondDiff,
      bodyContents,
    );
  }

  pushCustomerSalesRow = (
    customerTextKey: string,
    salesFirst: any,
    salesSecond: any,
    firstDiff: number,
    secondDiff: number,
    bodyContents: any,
  ) => {
    bodyContents.push([
      this.localizationService.instant(customerTextKey),
      salesFirst.totalUnitPrice.toFixed(ROUNDING_PRECISION),
      salesFirst.totalUnits,
      firstDiff.toFixed(ROUNDING_PRECISION),
      salesSecond.totalUnitPrice.toFixed(ROUNDING_PRECISION),
      salesSecond.totalUnits,
      secondDiff.toFixed(ROUNDING_PRECISION),
    ]);
  };

  private calculateDiffAvgUnitPrice(order: SubOrderControlListDto) {
    return order.totalUnitPrice
      ? (order.totalUnits / order.totalUnitPrice) * 100
      : order.totalUnits !== 0
        ? -100
        : 0;
  }

  private filterAndGroupOrders(orders: SubOrderControlListDto[], dateRange: DateRangeType) {
    return orders
      .filter(({ deliveredDate }) => {
        const date = getDateFromDateTime(deliveredDate);
        const fromDate = getDateFromDateTime(dateRange.fromDate);
        const toDate = getDateFromDateTime(dateRange.toDate);
        return date >= fromDate && date <= toDate;
      })
      .reduce(
        (grouped, order) => {
          const key = this.getGroupedKey(order);

          if (!grouped[key]) {
            grouped[key] = { ...order };
          } else {
            grouped[key].totalUnitPrice += order.totalUnitPrice;
            grouped[key].totalUnits += order.totalUnits;
            grouped[key].avgUnitPrice = grouped[key].totalUnitPrice / grouped[key].totalUnits;
          }
          return grouped;
        },
        {} as Record<string, SubOrderControlListDto>,
      );
  }

  getGroupedKey(order: SubOrderControlListDto) {
    return `${order.customerId}${
      this.reportCategory === ReportCategory.Details ? `_${order.productCode}` : ''
    }`;
  }

  private FilterAndAccumulate(orders: SubOrderControlListDto[], dateRange: DateRangeType) {
    const result = orders.reduce(
      (acc, order) => {
        const date = getDateFromDateTime(order.deliveredDate);
        const fromDate = getDateFromDateTime(dateRange.fromDate);
        const toDate = getDateFromDateTime(dateRange.toDate);
        if (date >= fromDate && date <= toDate) {
          acc.totalUnits += order.totalUnits;
          acc.totalUnitPrice += order.totalUnitPrice;
          acc.avgUnitPrice = acc.totalUnitPrice / acc.totalUnits;
        }
        return acc;
      },
      { totalUnits: 0, totalUnitPrice: 0, avgUnitPrice: 0 },
    );

    return {
      totalUnits: result.totalUnits,
      totalUnitPrice: result.totalUnitPrice,
      avgUnitPrice: result.avgUnitPrice,
    } as SubOrderControlListDto;
  }

  private getFilterTableBody(): any[][] {
    const allSelectionText = this.localizationService.instant(
      '::Reports:OrderReport:Filter:AllSelect',
    );
    const selectedClassNamesTextTemplate = this.localizationService.instant(
      '::Reports:ProductSalesComparisonByCustomer:SelectedClassNames',
    );
    const classNames = formatFilterItem(this.selectedClassNames, allSelectionText);
    const productNames = formatFilterItem(this.selectedProductNames, allSelectionText);
    const productDepartmentNames = formatFilterItem(
      this.selectedProductDepartmentNames,
      allSelectionText,
    );
    const storeNames = formatFilterItem(this.selectedStoreNames, allSelectionText);
    const productTypeNames = formatFilterItem(this.selectedProductTypeNames, allSelectionText);

    const productFilter = this.localizationService.instant(
      '::Reports:ProductSalesByDeliveryType:Filter:Product',
    );
    const productTypeFilter = this.localizationService.instant(
      '::Reports:ProductSalesByDeliveryType:Filter:ProductType',
    );
    const productDeptFilter = this.localizationService.instant(
      '::Reports:OrderReport:Filter:ProductDepartment',
    );
    const storesFilter = this.localizationService.instant('::Reports:OrderReport:Filter:Stores');

    return [
      [selectedClassNamesTextTemplate, classNames, storesFilter, storeNames],
      [productTypeFilter, productTypeNames, productDeptFilter, productDepartmentNames],
      [productFilter, productNames],
    ];
  }

  private addFilterTable(doc: jsPDF, filterBody: any[][]): void {
    autoTable(doc, {
      body: filterBody,
      startY: this.reportConfig.tableStartY,
      theme: 'plain',
      styles: {
        fontSize: this.reportConfig.tableFontSize + 1,
        cellPadding: this.reportConfig.tableCellPadding,
      },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'right', minCellWidth: 40 },
        1: { halign: 'left', minCellWidth: 80 },
        2: { fontStyle: 'bold', halign: 'right', minCellWidth: 60 },
        3: { halign: 'left', minCellWidth: 80 },
      },
      headStyles: { halign: 'center', font: REPORT_FONT_NAME, fontStyle: REPORT_FONT_TYPE },
      bodyStyles: { halign: 'center', font: REPORT_FONT_NAME, fontStyle: REPORT_FONT_TYPE },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
