import { Injectable, OnDestroy } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ToasterService } from '@abp/ng.theme.shared';
import {
  FilterPagedAndSortedOrderControlListResultRequestDto,
  OrderService,
  SubOrderControlListDto,
} from '@proxy/orders';
import { LocalizationService } from '@abp/ng.core';
import { DateRangeType } from '../models/date-range-type';
import { ReportCategory } from '@proxy/reports';
import {
  REPORT_FONT_FILE_NAME,
  REPORT_FONT_NAME,
  REPORT_FONT_TYPE,
  REPORT_HEADER_BACKGROUND_COLOR,
  REPORT_HEADER_TEXT_COLOR,
  ROUNDING_PRECISION,
} from '../shared/constants';
import trebucFont from 'src/assets/fonts/trebuc-normal.js';
import { getDateFromDateTime } from '../shared/date-time-utils';
import { formatFilterItem } from './reports/reports-utils';

@Injectable({
  providedIn: 'root',
})
export class ProductTypeComparisonsReportService implements OnDestroy {
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
    filterSectionY: 48,
    tableStartY: 55,
  };
  selectedStoreNames: string[] = [];
  selectedProductTypeNames: string[] = [];
  selectedProductDepartmentNames: string[] = [];
  selectedProductNames: string[] = [];
  reportCategory: ReportCategory;

  constructor(
    private http: HttpClient,
    private toasterService: ToasterService,
    private orderService: OrderService,
    private readonly localizationService: LocalizationService,
  ) {}

  generateReport(
    input: FilterPagedAndSortedOrderControlListResultRequestDto,
    firstDateRange: DateRangeType,
    secondDateRange: DateRangeType,
    stores: string[],
    productTypes: string[],
    productDepartments: string[],
    products: string[],
    reportCategory: ReportCategory,
  ) {
    this.firstDateRange = firstDateRange;
    this.secondDateRange = secondDateRange;
    this.selectedStoreNames = stores;
    this.selectedProductTypeNames = productTypes;
    this.selectedProductDepartmentNames = productDepartments;
    this.selectedProductNames = products;
    this.reportCategory = reportCategory;

    forkJoin([
      this.orderService.generateProductTypeComparisonsReport(input),
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
          this.generateProductSalesComparisonsReportPdf(orders, logoBase64);
        };
      });
  }

  private generateProductSalesComparisonsReportPdf(
    orders: SubOrderControlListDto[],
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

    const reportBody = this.getReportBody(orders);
    this.addReportContents(doc, reportBody, logoBase64, currentTime);

    const fileName =
      this.reportCategory === ReportCategory.Summary
        ? this.localizationService.instant(
            '::Reports:ProductTypeComparisons:Summary:DownloadableFileName',
          )
        : this.localizationService.instant(
            '::Reports:ProductTypeComparisons:Details:DownloadableFileName',
          );

    doc.save(fileName);
  }

  private addReportContents(doc: jsPDF, body: any, logoBase64: string, currentTime: string) {
    const formattedBody = body.map(row => {
      if (this.reportCategory === ReportCategory.Details) {
        return [
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
      return [
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
      ];
    });

    const productTypeColumnName = this.localizationService.instant(
      '::Reports:ProductTypeComparisons:ProductType',
    );
    const productCodeColumnName = this.localizationService.instant(
      '::Reports:ProductTypeComparisons:ProductCode',
    );
    const productDescriptionColumnName = this.localizationService.instant(
      '::Reports:ProductTypeComparisons:ProductDescription',
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
    const reportName = this.localizationService.instant(
      '::Reports:ProductTypeComparisons:ReportName',
    );
    const difference = this.localizationService.instant(
      '::Reports:ProductTypeComparisons:Difference',
    );

    const firstFromDate = this.formatDate(this.firstDateRange.fromDate);
    const firstToDate = this.formatDate(this.firstDateRange.toDate);
    const secondFromDate = this.formatDate(this.secondDateRange.fromDate);
    const secondToDate = this.formatDate(this.secondDateRange.toDate);

    const firstSelectedDateInfo =
      firstFromDate && firstToDate ? `${firstFromDate} To ${firstToDate}` : '';
    const secondSelectedDateInfo =
      secondFromDate && secondToDate ? `${secondFromDate} To ${secondToDate}` : '';

    const firstHeaderRow =
      this.reportCategory === ReportCategory.Details
        ? [
            { content: '', colSpan: 2 },
            { content: firstSelectedDateInfo, colSpan: 3 },
            '',
            { content: secondSelectedDateInfo, colSpan: 3 },
            '',
            { content: difference, colSpan: 3 },
          ]
        : [
            { content: '', colSpan: 1 },
            { content: firstSelectedDateInfo, colSpan: 3 },
            '',
            { content: secondSelectedDateInfo, colSpan: 3 },
            '',
            { content: difference, colSpan: 3 },
          ];

    const secondHeaderRow =
      this.reportCategory === ReportCategory.Details
        ? [
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
          ]
        : [
            productTypeColumnName,
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

    const mainTableY = this.reportConfig.tableStartY + 25;

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
    doc.text(byDelDate, 90, 50);
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
    const firstSetOrders = this.filterAndGroupOrders(
      orders,
      this.firstDateRange,
      this.reportCategory,
    );
    const secondSetOrders = this.filterAndGroupOrders(
      orders,
      this.secondDateRange,
      this.reportCategory,
    );

    let totalFirstSetUnitPrice = 0;
    let totalSecondSetUnitPrice = 0;
    let totalFirstSetUnits = 0;
    let totalSecondSetUnits = 0;
    let totalDiffUnitPrice = 0;
    let totalDiffUnits = 0;

    const finalGroupOrders = orders.reduce(
      (grouped, order) => {
        const key =
          this.reportCategory === ReportCategory.Summary
            ? order.productTypeValueId
            : order.productCode;

        if (!grouped[key]) {
          grouped[key] = [];
        }

        grouped[key].push(order);
        return grouped;
      },
      {} as Record<string, SubOrderControlListDto[]>,
    );

    let bodyContents: any[] = [];

    let productTypeIds: string[] = [];

    Object.keys(finalGroupOrders)
      .sort((a, b) => {
        a =
          this.reportCategory === ReportCategory.Summary
            ? a
            : orders.find(c => c.productCode === a)?.productTypeValueId;
        b =
          this.reportCategory === ReportCategory.Summary
            ? b
            : orders.find(c => c.productCode === b)?.productTypeValueId;

        const productA = orders.find(c => c.productTypeValueId === a);
        const productB = orders.find(c => c.productTypeValueId === b);

        return (productA?.productTypeValueId || '').localeCompare(
          productB?.productTypeValueId || '',
        );
      })
      .forEach(groupKey => {
        const matchingOrder = orders.find(c =>
          this.reportCategory === ReportCategory.Summary
            ? c.productTypeValueId === groupKey
            : c.productCode === groupKey,
        );

        if (!matchingOrder) return;

        const groupName =
          this.reportCategory === ReportCategory.Summary
            ? matchingOrder.productTypeValueName
            : matchingOrder.productCode || '';

        const productDescription =
          this.reportCategory === ReportCategory.Details ? matchingOrder.productDescription : '';

        const firstSet = firstSetOrders[groupKey] || {
          totalUnits: 0,
          totalUnitPrice: 0,
          avgUnitPrice: 0,
        };
        const secondSet = secondSetOrders[groupKey] || {
          totalUnits: 0,
          totalUnitPrice: 0,
          avgUnitPrice: 0,
        };

        const diffUnits = firstSet.totalUnits - secondSet.totalUnits;
        const diffUnitPrice = firstSet.totalUnitPrice - secondSet.totalUnitPrice;
        const diffAvgPrice = firstSet.totalUnitPrice
          ? (diffUnitPrice / firstSet.totalUnitPrice) * 100
          : diffUnitPrice !== 0
            ? -100
            : 0;

        totalFirstSetUnitPrice += firstSet.totalUnitPrice;
        totalSecondSetUnitPrice += secondSet.totalUnitPrice;
        totalFirstSetUnits += firstSet.totalUnits;
        totalSecondSetUnits += secondSet.totalUnits;
        totalDiffUnitPrice += diffUnitPrice;
        totalDiffUnits += diffUnits;

        if (this.reportCategory === ReportCategory.Details) {
          const typeId = orders.find(c => c.productCode === groupKey)?.productTypeValueId;
          if (!productTypeIds.includes(typeId)) {
            this.calculateProductTypeForDetailsReport(bodyContents, orders, typeId);
            productTypeIds.push(typeId);
          }
        }

        if (this.reportCategory === ReportCategory.Summary) {
          bodyContents.push({
            0: groupName,
            1: firstSet.totalUnitPrice.toFixed(ROUNDING_PRECISION),
            2: firstSet.totalUnits,
            3: firstSet.avgUnitPrice.toFixed(ROUNDING_PRECISION),
            4: secondSet.totalUnitPrice.toFixed(ROUNDING_PRECISION),
            5: secondSet.totalUnits,
            6: secondSet.avgUnitPrice.toFixed(ROUNDING_PRECISION),
            7: diffUnitPrice.toFixed(ROUNDING_PRECISION),
            8: diffUnits,
            9: diffAvgPrice.toFixed(1),
          });
        } else {
          bodyContents.push({
            0: groupName,
            1: productDescription,
            2: firstSet.totalUnitPrice.toFixed(ROUNDING_PRECISION),
            3: firstSet.totalUnits,
            4: firstSet.avgUnitPrice.toFixed(ROUNDING_PRECISION),
            5: secondSet.totalUnitPrice.toFixed(ROUNDING_PRECISION),
            6: secondSet.totalUnits,
            7: secondSet.avgUnitPrice.toFixed(ROUNDING_PRECISION),
            8: diffUnitPrice.toFixed(ROUNDING_PRECISION),
            9: diffUnits,
            10: diffAvgPrice.toFixed(1),
          });
        }
      });

    this.addLocationTotal(
      totalFirstSetUnits,
      totalFirstSetUnitPrice,
      totalSecondSetUnits,
      totalSecondSetUnitPrice,
      totalDiffUnitPrice,
      bodyContents,
      totalDiffUnits,
    );

    return bodyContents;
  }

  private calculateProductTypeForDetailsReport(
    bodyContents: any[],
    orders: SubOrderControlListDto[],
    productTypeId: string,
  ) {
    const firstSetOrders = this.filterAndGroupOrders(
      orders,
      this.firstDateRange,
      ReportCategory.Summary,
      productTypeId,
    );
    const secondSetOrders = this.filterAndGroupOrders(
      orders,
      this.secondDateRange,
      ReportCategory.Summary,
      productTypeId,
    );

    const firstSet = firstSetOrders[productTypeId] || {
      totalUnits: 0,
      totalUnitPrice: 0,
      avgUnitPrice: 0,
    };
    const secondSet = secondSetOrders[productTypeId] || {
      totalUnits: 0,
      totalUnitPrice: 0,
      avgUnitPrice: 0,
    };

    const diffUnits = firstSet.totalUnits - secondSet.totalUnits;
    const diffUnitPrice = firstSet.totalUnitPrice - secondSet.totalUnitPrice;
    const diffAvgPrice = firstSet.totalUnitPrice
      ? (diffUnitPrice / firstSet.totalUnitPrice) * 100
      : diffUnitPrice !== 0
        ? -100
        : 0;

    const productTypeName = orders.find(
      c => c.productTypeValueId === productTypeId,
    )?.productTypeValueName;

    bodyContents.push({
      0: '',
      1: `*** ${productTypeName}`,
      2: firstSet.totalUnitPrice.toFixed(ROUNDING_PRECISION),
      3: firstSet.totalUnits,
      4: firstSet.avgUnitPrice.toFixed(ROUNDING_PRECISION),
      5: secondSet.totalUnitPrice.toFixed(ROUNDING_PRECISION),
      6: secondSet.totalUnits,
      7: secondSet.avgUnitPrice.toFixed(ROUNDING_PRECISION),
      8: diffUnitPrice.toFixed(ROUNDING_PRECISION),
      9: diffUnits,
      10: diffAvgPrice.toFixed(1),
    });
  }

  private addLocationTotal(
    totalFirstSetUnits: number,
    totalFirstSetUnitPrice: number,
    totalSecondSetUnits: number,
    totalSecondSetUnitPrice: number,
    totalDiffUnitPrice: number,
    bodyContents: any[],
    totalDiffUnits: number,
  ) {
    const locationTotalText = this.localizationService.instant(
      '::Reports:ProductTypeComparisons:SubTotal',
    );

    const avgFirstSetUnitPrice = totalFirstSetUnits
      ? totalFirstSetUnitPrice / totalFirstSetUnits
      : 0;
    const avgSecondSetUnitPrice = totalSecondSetUnits
      ? totalSecondSetUnitPrice / totalSecondSetUnits
      : 0;
    const totalDiffAvgPrice = totalFirstSetUnitPrice
      ? (totalDiffUnitPrice / totalFirstSetUnitPrice) * 100
      : totalDiffUnitPrice !== 0
        ? -100
        : 0;

    const baseRowData = [
      locationTotalText,
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
      baseRowData.unshift('');
    }

    bodyContents.push(baseRowData);
  }

  private filterAndGroupOrders(
    orders: SubOrderControlListDto[],
    dateRange: DateRangeType,
    reportCategory: ReportCategory,
    productTypeId: string = null,
  ) {
    return orders
      .filter(({ deliveredDate, productTypeValueId }) => {
        const date = getDateFromDateTime(deliveredDate);
        const fromDate = getDateFromDateTime(dateRange.fromDate);
        const toDate = getDateFromDateTime(dateRange.toDate);
        return productTypeId
          ? productTypeValueId === productTypeId && date >= fromDate && date <= toDate
          : date >= fromDate && date <= toDate;
      })
      .reduce(
        (grouped, order) => {
          const key =
            reportCategory === ReportCategory.Summary
              ? order.productTypeValueId
              : order.productCode;

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

    const productTypeFilter = this.localizationService.instant(
      '::Reports:ProductTypeComparisons:Filter:ProductType',
    );
    const productDeptFilter = this.localizationService.instant(
      '::Reports:ProductTypeComparisons:Filter:ProductDepartment',
    );
    const storesFilter = this.localizationService.instant('::Reports:OrderReport:Filter:Stores');
    const productFilter = this.localizationService.instant(
      '::Reports:ProductSalesByDeliveryType:Filter:Product',
    );

    return [
      [storesFilter, storeNames, productTypeFilter, productTypeNames],
      [productDeptFilter, productDepartmentNames, productFilter, productNames],
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
        0: { fontStyle: 'bold', halign: 'right', minCellWidth: 60 },
        1: { halign: 'left', minCellWidth: 80 },
        2: { fontStyle: 'bold', halign: 'right', minCellWidth: 40 },
        3: { halign: 'left', minCellWidth: 80 },
      },
      headStyles: { halign: 'left', font: REPORT_FONT_NAME, fontStyle: REPORT_FONT_TYPE },
      bodyStyles: { halign: 'left', font: REPORT_FONT_NAME, fontStyle: REPORT_FONT_TYPE },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
