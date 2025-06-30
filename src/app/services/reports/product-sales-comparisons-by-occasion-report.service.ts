import { Injectable, OnDestroy } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ToasterService } from '@abp/ng.theme.shared';
import { DateRangeType } from 'src/app/models/date-range-type';
import { ReportCategory, SalesComparisonsReportService } from '@proxy/reports';
import {
  FilterPagedAndSortedOrderControlListResultRequestDto,
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
} from 'src/app/shared/constants';
import trebucFont from 'src/assets/fonts/trebuc-normal.js';
import { getDateFromDateTime } from 'src/app/shared/date-time-utils';
import { OccasionCode } from '@proxy/recipients';
import { formatFilterItem } from './reports-utils';

@Injectable({
  providedIn: 'root',
})
export class ProductSalesComparisonsByOccasionReportService implements OnDestroy {
  private readonly logoUrl = 'assets/images/logo/ffc-logo.jpg';
  destroy$: Subject<void> = new Subject();
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
  reportCategory: ReportCategory;

  constructor(
    private http: HttpClient,
    private toasterService: ToasterService,
    private salesComparisonsReportService: SalesComparisonsReportService,
    private readonly localizationService: LocalizationService,
  ) {}

  generateReport(
    input: FilterPagedAndSortedOrderControlListResultRequestDto,
    firstDateRange: DateRangeType,
    secondDateRange: DateRangeType,
    selectedStoreNames: string[],
    selectedProductNames: string[],
    selectedProductDepartmentNames: string[],
    selectedProductTypeName: string[],
    reportCategory: ReportCategory,
  ) {
    this.firstDateRange = firstDateRange;
    this.secondDateRange = secondDateRange;
    this.selectedStoreNames = selectedStoreNames;
    this.selectedProductDepartmentNames = selectedProductDepartmentNames;
    this.selectedProductTypeNames = selectedProductTypeName;
    this.selectedProductNames = selectedProductNames;
    this.reportCategory = reportCategory;

    forkJoin([
      this.salesComparisonsReportService.generateProductSalesComparisonsByOccasionReport(input),
      this.http.get(this.logoUrl, { responseType: 'blob' }),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([orders, logoBlob]) => {
        if (!orders || orders.length === 0) {
          this.toasterService.warn('::CustomerProductAnalysisReport:NotFound');
          return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(logoBlob);
        reader.onloadend = () => {
          const logoBase64 = reader.result as string;
          this.generateReportPdf(orders, logoBase64);
        };
      });
  }

  private generateReportPdf(orders: SubOrderControlListDto[], logoBase64: string): void {
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
      const reportBody = this.getReportBody(orders);
      this.addReportContents(doc, reportBody, logoBase64, currentTime);
    }

    if (this.reportCategory === ReportCategory.Details) {
      let locationTotal = {
        firstTotalUnitPrice: 0,
        firstTotalUnits: 0,
        secondTotalUnits: 0,
        secondTotalUnitPrice: 0,
        totalDiffUnitPrice: 0,
        totalDiffUnits: 0,
        totalDiffAvgPrice: 0,
      };

      const occasionOrderEntries = Object.entries(this.groupOrdersByOccasion(orders));
      const totalEntries = occasionOrderEntries.length;
      occasionOrderEntries.forEach(([occasion, occasionOrders], index) => {
        const occasionCode = occasionOrders[0]?.occasionCode;

        const reportBody = this.getReportBody(occasionOrders);
        this.calculateLocationTotals(reportBody, locationTotal);

        if (index === totalEntries - 1) {
          this.addLocationTotal(
            locationTotal.firstTotalUnits,
            locationTotal.firstTotalUnitPrice,
            locationTotal.secondTotalUnits,
            locationTotal.secondTotalUnitPrice,
            locationTotal.totalDiffUnitPrice,
            locationTotal.totalDiffUnits,
            reportBody,
            null,
            true,
          );
        }

        this.addReportContents(doc, reportBody, logoBase64, currentTime, occasionCode);

        if (index < totalEntries - 1) {
          doc.addPage();
        }
      });
    }

    const fileName =
      this.reportCategory === ReportCategory.Summary
        ? this.localizationService.instant(
            '::Reports:ProductSalesComparisonsByOccasion:Summary:DownloadableFileName',
          )
        : this.localizationService.instant(
            '::Reports:ProductSalesComparisonsByOccasion:Details:DownloadableFileName',
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
      totalDiffUnitPrice: number;
      totalDiffUnits: number;
      totalDiffAvgPrice: number;
    },
  ) {
    let totalEntries = reportBody.length;
    reportBody.forEach((row, index) => {
      if (index === totalEntries - 1) return;

      locationTotal.firstTotalUnitPrice += parseFloat(row[2] as string);
      locationTotal.firstTotalUnits += parseFloat(row[3] as string);
      locationTotal.secondTotalUnitPrice += parseFloat(row[5] as string);
      locationTotal.secondTotalUnits += parseFloat(row[6] as string);
      locationTotal.totalDiffUnitPrice =
        locationTotal.firstTotalUnitPrice - locationTotal.secondTotalUnitPrice;
      locationTotal.totalDiffUnits = locationTotal.firstTotalUnits - locationTotal.secondTotalUnits;
      locationTotal.totalDiffAvgPrice = this.calculateDiffAvgPrice(
        locationTotal.firstTotalUnitPrice,
        locationTotal.totalDiffUnitPrice,
      );
    });
  }

  private addReportContents(
    doc: jsPDF,
    body: any,
    logoBase64: string,
    currentTime: string,
    occasionCode?: OccasionCode,
  ) {
    const formattedBody = [...body.map(row => this.formatBodyRow(row))];
    const { firstHeaderRow, secondHeaderRow } = this.getTableHeaders();

    const reportName = this.localizationService.instant(
      '::Reports:ProductSalesComparisonsByOccasion:ReportName',
    );
    const emptyOccasionCode = this.localizationService.instant(
      '::Reports:Common:EmptyOccasionCode',
    );
    const occasionCodeFilter = this.localizationService.instant('::Reports:Filter:Occasion');
    const occasionCodeInfo = this.localizationService.instant(
      `::Enum:OccasionCode.${occasionCode}`,
    );

    const offSet = this.reportCategory === ReportCategory.Details ? 29 : 22;
    const mainTableY = this.reportConfig.tableStartY + offSet;

    if (this.reportCategory === ReportCategory.Details) {
      const occasionCodeText = `${occasionCodeFilter} ${occasionCode ? occasionCodeInfo : emptyOccasionCode}`;
      doc.setFontSize(14);
      doc.text(occasionCodeText, 14, mainTableY - 5);
    }

    autoTable(doc, {
      startY: mainTableY,
      head: [firstHeaderRow, secondHeaderRow],
      body: formattedBody,
      didDrawPage: data => {
        this.addPageHeader(doc, logoBase64, currentTime, data.pageNumber, reportName);

        const filterBody = this.getFilterTableBody();
        this.addFilterTable(doc, filterBody);
      },
      margin: { top: mainTableY },
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
    });
  }

  formatDateRange(fromDate: Date, toDate: Date) {
    return fromDate && toDate ? `${this.formatDate(fromDate)} To ${this.formatDate(toDate)}` : '';
  }

  private getTableHeaders(): { firstHeaderRow: any[]; secondHeaderRow: string[] } {
    const occasionColumnName = this.localizationService.instant(
      '::Reports:ProductSalesComparisonsByOccasion:Occasion',
    );
    const salesAmtColumnName = this.localizationService.instant(
      '::Reports:ProductTypeComparisons:SalesAmount',
    );
    const unitsColumnName = this.localizationService.instant(
      '::Reports:ProductTypeComparisons:Units',
    );
    const avgColumnName = this.localizationService.instant('::Reports:ProductTypeComparisons:Avg');
    const salesDevColumnName = this.localizationService.instant(
      '::Reports:ProductTypeComparisons:SalesDevAmt',
    );
    const dev = this.localizationService.instant('::Reports:ProductTypeComparisons:Dev');
    const difference = this.localizationService.instant(
      '::Reports:ProductTypeComparisons:Difference',
    );
    const productInfo = this.localizationService.instant(
      '::Reports:ProductSalesByOrderPlacement:ProductInfo',
    );
    const productCodeColumnName = this.localizationService.instant(
      '::Reports:ProductRankingReport:ProductCode',
    );
    const productDescriptionColumnName = this.localizationService.instant(
      '::Reports:ProductRankingReport:ProductDescription',
    );

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
            { content: occasionColumnName, colSpan: 1 },
            { content: firstSelectedDateInfo, colSpan: 3 },
            { content: '' },
            { content: secondSelectedDateInfo, colSpan: 3 },
            { content: '' },
            { content: difference, colSpan: 3 },
          ]
        : [
            { content: productInfo, colSpan: 2 },
            { content: firstSelectedDateInfo, colSpan: 3 },
            { content: '' },
            { content: secondSelectedDateInfo, colSpan: 3 },
            { content: '' },
            { content: difference, colSpan: 3 },
          ];

    const secondHeaderRow =
      this.reportCategory === ReportCategory.Summary
        ? [
            '',
            salesAmtColumnName,
            unitsColumnName,
            avgColumnName,
            '',
            salesAmtColumnName,
            unitsColumnName,
            avgColumnName,
            '',
            salesDevColumnName,
            unitsColumnName,
            dev,
          ]
        : [
            productCodeColumnName,
            productDescriptionColumnName,
            salesAmtColumnName,
            unitsColumnName,
            avgColumnName,
            '',
            salesAmtColumnName,
            unitsColumnName,
            avgColumnName,
            '',
            salesDevColumnName,
            unitsColumnName,
            dev,
          ];

    return { firstHeaderRow, secondHeaderRow };
  }

  formatBodyRow(row: any[]) {
    return this.reportCategory === ReportCategory.Summary
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

  private groupOrdersByOccasion(orders: SubOrderControlListDto[]): {
    [key: string]: SubOrderControlListDto[];
  } {
    return orders.reduce(
      (groupedOrders, order) => {
        const key = order.occasionCode;

        groupedOrders[key] = groupedOrders[key] || [];
        groupedOrders[key].push(order);
        return groupedOrders;
      },
      {} as { [key: string]: SubOrderControlListDto[] },
    );
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
      '::Reports:ProductTypeComparisons:ByDelDate',
    );
    doc.text(byDelDate, 70, 50);
    const allWholeSaleAndRetail = this.localizationService.instant(
      '::Reports:ProductTypeComparisons:AllWholesaleAndRetail',
    );
    doc.text(allWholeSaleAndRetail, 170, 50);
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

  private getReportBody(orders: SubOrderControlListDto[]) {
    const firstSetOrders = this.filterAndGroupOrders(orders, this.firstDateRange);
    const secondSetOrders = this.filterAndGroupOrders(orders, this.secondDateRange);

    let totalFirstSetUnitPrice = 0;
    let totalSecondSetUnitPrice = 0;
    let totalFirstSetUnits = 0;
    let totalSecondSetUnits = 0;
    let totalDiffUnitPrice = 0;
    let totalDiffUnits = 0;

    const emptyOccasionCode = this.localizationService.instant(
      '::Reports:Common:EmptyOccasionCode',
    );

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

      const diffUnits = firstSet.totalUnits - secondSet.totalUnits;
      const diffUnitPrice = firstSet.totalUnitPrice - secondSet.totalUnitPrice;
      const diffAvgPrice = this.calculateDiffAvgPrice(firstSet.totalUnitPrice, diffUnitPrice);

      totalFirstSetUnitPrice += firstSet.totalUnitPrice;
      totalSecondSetUnitPrice += secondSet.totalUnitPrice;
      totalFirstSetUnits += firstSet.totalUnits;
      totalSecondSetUnits += secondSet.totalUnits;
      totalDiffUnitPrice += diffUnitPrice;
      totalDiffUnits += diffUnits;

      const occasionCodeText = this.localizationService.instant(
        `::Enum:OccasionCode.${orderInfo.occasionCode}`,
      );
      const occasionCode = orderInfo.occasionCode
        ? `*** ${occasionCodeText}  TOTALS ***`
        : `*** ${emptyOccasionCode}  TOTALS ***`;

      return isSummaryReport
        ? [
            occasionCode || '',
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
    const occasionCodeText = this.localizationService.instant(
      `::Enum:OccasionCode.${orderInfo.occasionCode}`,
    );

    this.addLocationTotal(
      totalFirstSetUnits,
      totalFirstSetUnitPrice,
      totalSecondSetUnits,
      totalSecondSetUnitPrice,
      totalDiffUnitPrice,
      totalDiffUnits,
      bodyContents,
      orderInfo.occasionCode ? occasionCodeText : null,
    );

    return bodyContents;
  }

  private calculateDiffAvgPrice(firstSetTotalUnitPrice, diffUnitPrice: number) {
    return firstSetTotalUnitPrice
      ? (diffUnitPrice / firstSetTotalUnitPrice) * 100
      : diffUnitPrice !== 0
        ? -100
        : 0;
  }

  private addLocationTotal(
    totalFirstSetUnits: number,
    totalFirstSetUnitPrice: number,
    totalSecondSetUnits: number,
    totalSecondSetUnitPrice: number,
    totalDiffUnitPrice: number,
    totalDiffUnits: number,
    bodyContents: any[],
    occasionCode?: string,
    isGrandTotal: boolean = false,
  ) {
    const locationTotalTextTemplate = this.localizationService.instant('::Reports:Common:SubTotal');
    const emptyOccasionCode = this.localizationService.instant(
      '::Reports:Common:EmptyOccasionCode',
    );

    const occasionCodeDetails = occasionCode
      ? `*** ${occasionCode}  TOTALS ***`
      : `*** ${emptyOccasionCode}  TOTALS ***`;
    const locationTotalText =
      this.reportCategory === ReportCategory.Summary
        ? locationTotalTextTemplate
        : occasionCodeDetails;

    const avgFirstSetUnitPrice = totalFirstSetUnits
      ? totalFirstSetUnitPrice / totalFirstSetUnits
      : 0;
    const avgSecondSetUnitPrice = totalSecondSetUnits
      ? totalSecondSetUnitPrice / totalSecondSetUnits
      : 0;
    const totalDiffAvgPrice = this.calculateDiffAvgPrice(
      totalFirstSetUnitPrice,
      totalDiffUnitPrice,
    );

    let locationText = [
      !isGrandTotal ? locationTotalText : locationTotalTextTemplate,
      totalFirstSetUnitPrice.toFixed(ROUNDING_PRECISION),
      totalFirstSetUnits,
      avgFirstSetUnitPrice.toFixed(ROUNDING_PRECISION),
      totalSecondSetUnitPrice.toFixed(ROUNDING_PRECISION),
      totalSecondSetUnits,
      avgSecondSetUnitPrice.toFixed(ROUNDING_PRECISION),
      totalDiffUnitPrice.toFixed(ROUNDING_PRECISION),
      totalDiffUnits,
      totalDiffAvgPrice.toFixed(1),
    ];

    if (this.reportCategory === ReportCategory.Details) {
      locationText.unshift('');
    }

    bodyContents.push(locationText);
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
    return `${order.occasionCode}${
      this.reportCategory === ReportCategory.Details ? `_${order.productCode}` : ''
    }`;
  }

  private formatDate(date: Date) {
    return date ? new Date(date).toLocaleDateString() : '';
  }

  private getFilterTableBody(): any[][] {
    const allSelectionText = this.localizationService.instant(
      '::Reports:OrderReport:Filter:AllSelect',
    );
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
      [productTypeFilter, productTypeNames, productDeptFilter, productDepartmentNames],
      [productFilter, productNames, storesFilter, storeNames],
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
