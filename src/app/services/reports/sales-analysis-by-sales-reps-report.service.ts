import { Injectable, OnDestroy } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ToasterService } from '@abp/ng.theme.shared';
import {
  FilterPagedAndSortedOrderControlListResultRequestDto,
  OrderType,
  SubOrderControlListDto,
} from '@proxy/orders';
import { LocalizationService } from '@abp/ng.core';
import { SalesAnalysisReportService } from '@proxy/reports';
import trebucFont from 'src/assets/fonts/trebuc-normal.js';
import {
  REPORT_FONT_FILE_NAME,
  REPORT_FONT_NAME,
  REPORT_FONT_TYPE,
  REPORT_HEADER_BACKGROUND_COLOR,
  REPORT_HEADER_TEXT_COLOR,
  ROUNDING_PRECISION,
} from 'src/app/shared/constants';
import { ProductCategoryType } from '@proxy/products';

@Injectable({
  providedIn: 'root',
})
export class SalesAnalysisBySalesRepsReportService implements OnDestroy {
  private readonly logoUrl = 'assets/images/logo/ffc-logo.jpg';
  destroy$: Subject<void> = new Subject();
  readonly reportConfig = {
    imageX: 123,
    imageY: 10,
    imageWidth: 50,
    imageHeight: 20,
    tableFontSize: 7,
    tableCellPadding: 1,
    reportTitleFontSize: 18,
    reportTitleX: 148.5,
    reportTitleY: 40,
    salesAmtAndAvgWidth: 18.5,
    unitsWidth: 10,
    filterSectionY: 48,
    tableStartY: 55,
  };
  selectedSalesRepsNames: string[] = [];
  selectedProductNames: string[] = [];

  constructor(
    private http: HttpClient,
    private toasterService: ToasterService,
    private salesAnalysisReport: SalesAnalysisReportService,
    private readonly localizationService: LocalizationService,
  ) {}

  generateReport(
    input: FilterPagedAndSortedOrderControlListResultRequestDto,
    selectedSalesRepsNames: string[],
    selectedProductNames: string[],
  ) {
    this.selectedProductNames = selectedProductNames;
    this.selectedSalesRepsNames = selectedSalesRepsNames;

    forkJoin([
      this.salesAnalysisReport.generateSalesAnalysisBySalesRepsReport(input),
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
          this.generateReportPdf(orders, logoBase64, input);
        };
      });
  }

  private generateReportPdf(
    orders: SubOrderControlListDto[],
    logoBase64: string,
    input: FilterPagedAndSortedOrderControlListResultRequestDto,
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

    const salesRepOrderEntries = Object.entries(this.groupOrdersBySalesReps(orders));
    const totalEntries = salesRepOrderEntries.length;
    salesRepOrderEntries.forEach(([salesRep, salesRepOrders], index) => {
      const salesRepName = salesRepOrders[0]?.salesRepresentative;

      const reportBody = this.getReportBody(salesRepOrders);
      this.addReportContents(doc, reportBody, logoBase64, currentTime, input, salesRepName);

      if (index < totalEntries - 1) {
        doc.addPage();
      }
    });

    const fileName = this.localizationService.instant(
      '::Reports:SalesAnalysisBySalesReps:DownloadableFileName',
    );
    doc.save(fileName);
  }

  private groupOrdersBySalesReps(orders: SubOrderControlListDto[]): {
    [key: string]: SubOrderControlListDto[];
  } {
    return orders.reduce(
      (groupedOrders, order) => {
        const key = order.salesRepresentativeId;

        groupedOrders[key] = groupedOrders[key] || [];
        groupedOrders[key].push(order);
        return groupedOrders;
      },
      {} as { [key: string]: SubOrderControlListDto[] },
    );
  }

  private addReportContents(
    doc: jsPDF,
    body: any,
    logoBase64: string,
    currentTime: string,
    input: FilterPagedAndSortedOrderControlListResultRequestDto,
    salesRepName?: string,
  ) {
    const reportName = this.localizationService.instant(
      '::Reports:SalesAnalysisBySalesReps:ReportName',
    );

    const formattedBody = this.getFormattedBody(body);
    const { firstHeaderRow, secondHeaderRow, thirdHeaderRow } = this.getTableHeaders();
    const columnStyles = this.getColumnStyles();

    const mainTableY = this.reportConfig.tableStartY + 29;

    const salesPersonFilter = this.localizationService.instant('::Reports:Filters:Salesperson');
    const noEmployeeText = this.localizationService.instant(
      '::Reports:ProductSalesComparisonsBySalesPerson:NoEmployee',
    );
    doc.setFontSize(14);
    doc.text(`${salesPersonFilter} ${salesRepName || noEmployeeText}`, 8, mainTableY - 5);

    autoTable(doc, {
      startY: mainTableY,
      head: [firstHeaderRow, secondHeaderRow, thirdHeaderRow],
      body: formattedBody,
      columnStyles,
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
      tableWidth: 'wrap',
      margin: { left: 6, right: 6, top: mainTableY },
      didDrawPage: data => {
        this.addPageHeader(doc, logoBase64, currentTime, data.pageNumber, reportName);

        const filterBody = this.getFilterTableBody(input);
        this.addFilterTable(doc, filterBody);
      },
    });
  }

  private getFormattedBody(body: any): any[] {
    return body.map(row => {
      return [
        row[0],
        row[1],
        `$${row[2]}`,
        row[3],
        `$${row[4]}`,
        `$${row[5]}`,
        row[6],
        `$${row[7]}`,
        `$${row[8]}`,
        row[9],
        `$${row[10]}`,
        `$${row[11]}`,
        row[12],
        `$${row[13]}`,
        `$${row[14]}`,
        row[15],
        `$${row[16]}`,
      ];
    });
  }

  private getTableHeaders(): {
    firstHeaderRow: any[];
    secondHeaderRow: any[];
    thirdHeaderRow: string[];
  } {
    const productInfo = this.localizationService.instant(
      '::Reports:ProductSalesByOrderPlacement:ProductInfo',
    );
    const overAllSales = this.localizationService.instant(
      '::Reports:ProductSalesByOrderPlacement:OverallSales',
    );
    const swSales = this.localizationService.instant(
      '::Reports:ProductSalesByOrderPlacement:SWSales',
    );
    const soSales = this.localizationService.instant(
      '::Reports:ProductSalesByOrderPlacement:SOSales',
    );
    const salesLabel = this.localizationService.instant(
      '::Reports:ProductSalesByOrderPlacement:Sales',
    );
    const addonLabel = this.localizationService.instant(
      '::Reports:ProductSalesByOrderPlacement:AddOn',
    );
    const productCodeColumnName = this.localizationService.instant(
      '::Reports:ProductSalesByOrderPlacement:ProductCode',
    );
    const productDescriptionColumnName = this.localizationService.instant(
      '::Reports:ProductSalesByOrderPlacement:ProductDescription',
    );
    const salesAmtColumnName = this.localizationService.instant(
      '::Reports:ProductSalesByOrderPlacement:SalesAmount',
    );
    const unitsColumnName = this.localizationService.instant(
      '::Reports:ProductSalesByOrderPlacement:Units',
    );
    const avgColumnName = this.localizationService.instant(
      '::Reports:ProductSalesByOrderPlacement:Avg',
    );

    const firstHeaderRow = [
      { content: productInfo, colSpan: 2 },
      { content: overAllSales, colSpan: 3 },
      { content: swSales, colSpan: 6 },
      { content: soSales, colSpan: 6 },
    ];

    const secondHeaderRow = [
      { content: '', colSpan: 2 },
      { content: salesLabel, colSpan: 3 },
      { content: salesLabel, colSpan: 3 },
      { content: addonLabel, colSpan: 3 },
      { content: salesLabel, colSpan: 3 },
      { content: addonLabel, colSpan: 3 },
    ];

    const thirdHeaderRow = [
      productCodeColumnName,
      productDescriptionColumnName,
      salesAmtColumnName,
      unitsColumnName,
      avgColumnName,
      salesAmtColumnName,
      unitsColumnName,
      avgColumnName,
      salesAmtColumnName,
      unitsColumnName,
      avgColumnName,
      salesAmtColumnName,
      unitsColumnName,
      avgColumnName,
      salesAmtColumnName,
      unitsColumnName,
      avgColumnName,
    ];

    return { firstHeaderRow, secondHeaderRow, thirdHeaderRow };
  }

  private getColumnStyles() {
    const { salesAmtAndAvgWidth, unitsWidth } = this.reportConfig;

    return {
      0: { cellWidth: 20 },
      1: { cellWidth: 30 },
      2: { cellWidth: salesAmtAndAvgWidth },
      3: { cellWidth: unitsWidth },
      4: { cellWidth: salesAmtAndAvgWidth },
      5: { cellWidth: salesAmtAndAvgWidth },
      6: { cellWidth: unitsWidth },
      7: { cellWidth: salesAmtAndAvgWidth },
      8: { cellWidth: salesAmtAndAvgWidth },
      9: { cellWidth: unitsWidth },
      10: { cellWidth: salesAmtAndAvgWidth },
      11: { cellWidth: salesAmtAndAvgWidth },
      12: { cellWidth: unitsWidth },
      13: { cellWidth: salesAmtAndAvgWidth },
      14: { cellWidth: salesAmtAndAvgWidth },
      15: { cellWidth: unitsWidth },
      16: { cellWidth: salesAmtAndAvgWidth },
    };
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

    doc.setFontSize(14);
    const byDelDate = this.localizationService.instant(
      '::Reports:ProductSalesComparisons:ByDelDate',
    );
    doc.text(byDelDate, 148.5, 50, { align: 'center' });
  }

  private getReportBody(orders: SubOrderControlListDto[]) {
    const groupedOrders = {
      SW: this.filterAndGroupOrdersByOrderType(orders, OrderType.SW),
      SO: this.filterAndGroupOrdersByOrderType(orders, OrderType.SO),
    };

    const productWiseOrders = orders.reduce<Record<string, SubOrderControlListDto>>(
      (grouped, order) => {
        const key = order.productCode;

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

    let totalUnitPrice = { SW: 0, SO: 0 };
    let totalUnits = { SW: 0, SO: 0 };
    let totalAddOnUnitPrice = { SW: 0, SO: 0 };
    let totalAddOnUnits = { SW: 0, SO: 0 };

    const bodyContents = Object.entries(productWiseOrders)
      .sort(([keyA, orderA], [keyB, orderB]) => {
        return keyA.localeCompare(keyB);
      })
      .map(([key, orderInfo]) => {
        const groupingKey = orderInfo.productCode;

        const orderData = Object.keys(groupedOrders).reduce((acc, orderKey) => {
          const order = groupedOrders[orderKey][groupingKey] || {
            totalUnits: 0,
            totalUnitPrice: 0,
            avgUnitPrice: 0,
            totalAddOnUnits: 0,
            totalAddOnUnitPrice: 0,
            avgAddOnUnitPrice: 0,
          };

          if (orderInfo.productCategoryType === ProductCategoryType.Flower) {
            totalUnitPrice[orderKey] = (totalUnitPrice[orderKey] || 0) + order.totalUnitPrice;
            totalUnits[orderKey] = (totalUnits[orderKey] || 0) + order.totalUnits;
          } else {
            totalAddOnUnitPrice[orderKey] =
              (totalAddOnUnitPrice[orderKey] || 0) + order.totalUnitPrice;
            totalAddOnUnits[orderKey] = (totalAddOnUnits[orderKey] || 0) + order.totalUnits;
          }

          acc.push(
            orderInfo.productCategoryType === ProductCategoryType.Flower
              ? order.totalUnitPrice.toFixed(ROUNDING_PRECISION)
              : 0,
            orderInfo.productCategoryType === ProductCategoryType.Flower ? order.totalUnits : 0,
            orderInfo.productCategoryType === ProductCategoryType.Flower
              ? order.avgUnitPrice.toFixed(ROUNDING_PRECISION)
              : 0,
            orderInfo.productCategoryType === ProductCategoryType.AddOn
              ? order.totalUnitPrice.toFixed(ROUNDING_PRECISION)
              : 0,
            orderInfo.productCategoryType === ProductCategoryType.AddOn ? order.totalUnits : 0,
            orderInfo.productCategoryType === ProductCategoryType.AddOn
              ? order.avgUnitPrice.toFixed(ROUNDING_PRECISION)
              : 0,
          );
          return acc;
        }, []);

        const totalOrderUnits = Object.values(groupedOrders).reduce(
          (sum, orders) => sum + (orders[groupingKey]?.totalUnits || 0),
          0,
        );
        const totalOrderUnitPrice = Object.values(groupedOrders).reduce(
          (sum, orders) => sum + (orders[groupingKey]?.totalUnitPrice || 0),
          0,
        );
        const avgUnitPrice = totalOrderUnits ? totalOrderUnitPrice / totalOrderUnits : 0;

        return [
          this.extractProductCode(groupingKey),
          orderInfo.productDescription || '',
          totalOrderUnitPrice.toFixed(ROUNDING_PRECISION),
          totalOrderUnits,
          avgUnitPrice.toFixed(ROUNDING_PRECISION),
          ...orderData,
        ];
      });

    this.addLocationTotal(
      totalUnits.SW,
      totalUnitPrice.SW,
      totalUnits.SO,
      totalUnitPrice.SO,
      totalAddOnUnits.SW,
      totalAddOnUnitPrice.SW,
      totalAddOnUnits.SO,
      totalAddOnUnitPrice.SO,
      bodyContents,
    );

    return bodyContents;
  }

  private addLocationTotal(
    totalSwUnits: number,
    totalSwUnitPrice: number,
    totalSoUnits: number,
    totalSoUnitPrice: number,
    totalAddOnSwUnits: number,
    totalAddOnSwUnitPrice: number,
    totalAddOnSoUnits: number,
    totalAddOnSoUnitPrice: number,
    bodyContents: any[],
  ) {
    const locationTotalText = this.localizationService.instant(
      '::Reports:Common:SalesRepsSubTotal',
    );

    const avgSwUnitPrice = totalSwUnits ? totalSwUnitPrice / totalSwUnits : 0;
    const avgAddOnSwUnitPrice = totalAddOnSwUnits ? totalAddOnSwUnitPrice / totalAddOnSwUnits : 0;
    const avgSoUnitPrice = totalSoUnits ? totalSoUnitPrice / totalSoUnits : 0;
    const avgAddOnSoUnitPrice = totalAddOnSoUnits ? totalAddOnSoUnitPrice / totalAddOnSoUnits : 0;

    const totalUnits = totalSwUnits + totalSoUnits + totalAddOnSwUnits + totalAddOnSoUnits;
    const totalUnitPrice =
      totalSwUnitPrice + totalSoUnitPrice + totalAddOnSwUnitPrice + totalAddOnSoUnitPrice;
    const avgTotalUnitPrice = totalUnits ? totalUnitPrice / totalUnits : 0;

    const rowData = [
      '',
      locationTotalText,
      totalUnitPrice.toFixed(ROUNDING_PRECISION),
      totalUnits,
      avgTotalUnitPrice.toFixed(ROUNDING_PRECISION),

      totalSwUnitPrice.toFixed(ROUNDING_PRECISION),
      totalSwUnits,
      avgSwUnitPrice.toFixed(ROUNDING_PRECISION),

      totalAddOnSwUnitPrice.toFixed(ROUNDING_PRECISION),
      totalAddOnSwUnits,
      avgAddOnSwUnitPrice.toFixed(ROUNDING_PRECISION),

      totalSoUnitPrice.toFixed(ROUNDING_PRECISION),
      totalSoUnits,
      avgSoUnitPrice.toFixed(ROUNDING_PRECISION),

      totalAddOnSoUnitPrice.toFixed(ROUNDING_PRECISION),
      totalAddOnSoUnits,
      avgAddOnSoUnitPrice.toFixed(ROUNDING_PRECISION),
    ];

    bodyContents.push(rowData);
  }

  private filterAndGroupOrdersByOrderType(
    orders: SubOrderControlListDto[],
    orderType: OrderType,
  ): Record<string, SubOrderControlListDto> {
    return orders
      .filter(c => c.orderType === orderType)
      .reduce(
        (grouped, order) => {
          const key = order.productCode;

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

  private getFilterTableBody(input: FilterPagedAndSortedOrderControlListResultRequestDto): any[][] {
    const allSelectionText = this.localizationService.instant(
      '::Reports:OrderReport:Filter:AllSelect',
    );
    const fromDate = input.fromDate ? new Date(input.fromDate).toLocaleDateString() : '';
    const toDate = input.toDate ? new Date(input.toDate).toLocaleDateString() : '';
    const filterDateRange = this.localizationService.instant('::Reports:Common:DateRange');
    const dateRangeText = filterDateRange.replace('{0}', fromDate).replace('{1}', toDate);
    const selectedDateInfo = fromDate && toDate ? dateRangeText : '';

    const productNames =
      this.selectedProductNames.length > 0
        ? this.selectedProductNames.join(', ')
        : allSelectionText;
    const salesPersons =
      this.selectedSalesRepsNames.length > 0
        ? this.selectedSalesRepsNames.join(', ')
        : allSelectionText;

    const dateFilter = this.localizationService.instant('::Reports:OrderReport:Filter:Date');
    const salesPersonFilter = this.localizationService.instant('::Reports:Filters:Salesperson');
    const productFilter = this.localizationService.instant(
      '::Reports:ProductSalesByDeliveryType:Filter:Product',
    );

    return [
      [dateFilter, selectedDateInfo, productFilter, productNames],
      [salesPersonFilter, salesPersons],
    ];
  }

  private addFilterTable(doc: jsPDF, filterBody: any[][]): void {
    autoTable(doc, {
      body: filterBody,
      startY: this.reportConfig.tableStartY,
      theme: 'plain',
      styles: {
        fontSize: this.reportConfig.tableFontSize + 3,
        cellPadding: this.reportConfig.tableCellPadding + 1,
      },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'right', minCellWidth: 40 },
        1: { halign: 'left', minCellWidth: 80 },
        2: { fontStyle: 'bold', halign: 'right', minCellWidth: 40 },
        3: { halign: 'left', minCellWidth: 80 },
      },
      headStyles: { halign: 'center', font: REPORT_FONT_NAME, fontStyle: REPORT_FONT_TYPE },
      bodyStyles: { halign: 'center', font: REPORT_FONT_NAME, fontStyle: REPORT_FONT_TYPE },
    });
  }

  private extractProductCode(input: string): string {
    if (input.includes('=>')) {
      const parts = input.split('=>');
      return parts[1]?.trim() || '';
    }

    return input;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
