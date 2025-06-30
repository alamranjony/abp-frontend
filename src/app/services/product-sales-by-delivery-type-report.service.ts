import { Injectable, OnDestroy } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ToasterService } from '@abp/ng.theme.shared';
import {
  DeliveryCategory,
  FilterPagedAndSortedOrderControlListResultRequestDto,
  OrderType,
  SubOrderControlListDto,
} from '@proxy/orders';
import { LocalizationService } from '@abp/ng.core';
import { ReportCategory, SalesComparisonsReportService } from '@proxy/reports';
import {
  REPORT_FONT_FILE_NAME,
  REPORT_FONT_NAME,
  REPORT_FONT_TYPE,
  REPORT_HEADER_BACKGROUND_COLOR,
  REPORT_HEADER_TEXT_COLOR,
  ROUNDING_PRECISION,
} from '../shared/constants';
import trebucFont from 'src/assets/fonts/trebuc-normal.js';
import { formatFilterItem } from './reports/reports-utils';

@Injectable({
  providedIn: 'root',
})
export class ProductSalesByDeliveryTypeReportService implements OnDestroy {
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
    salesAmtAndAvgWidth: 20,
    unitsWidth: 10,
    filterSectionY: 48,
    tableStartY: 55,
  };
  selectedStoreNames: string[] = [];
  selectedProductNames: string[] = [];
  selectedProductDepartmentNames: string[] = [];
  selectedSalesTypes: string[] = [];
  reportCategory: ReportCategory;

  constructor(
    private http: HttpClient,
    private toasterService: ToasterService,
    private salesComparisonsReportService: SalesComparisonsReportService,
    private readonly localizationService: LocalizationService,
  ) {}

  generateReport(
    input: FilterPagedAndSortedOrderControlListResultRequestDto,
    selectedStoreNames: string[],
    selectedProductNames: string[],
    selectedProductDepartmentNames: string[],
    selectedSalesTypes: string[],
  ) {
    this.selectedStoreNames = selectedStoreNames;
    this.selectedProductDepartmentNames = selectedProductDepartmentNames;
    this.selectedProductNames = selectedProductNames;
    this.selectedSalesTypes = selectedSalesTypes;
    this.reportCategory = input.reportCategory;

    forkJoin([
      this.salesComparisonsReportService.generateProductSalesByDeliveryTypeReport(input),
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

    const reportBody = this.getReportBody(orders);
    this.addReportContents(doc, reportBody, logoBase64, currentTime, input);

    let fileName =
      this.reportCategory === ReportCategory.Summary
        ? this.localizationService.instant(
            '::Reports:ProductSalesByDeliveryType:Summary:DownloadableFileName',
          )
        : this.localizationService.instant(
            '::Reports:ProductSalesByDeliveryType:Details:DownloadableFileName',
          );

    doc.save(fileName);
  }

  private addReportContents(
    doc: jsPDF,
    body: any,
    logoBase64: string,
    currentTime: string,
    input: FilterPagedAndSortedOrderControlListResultRequestDto,
  ) {
    const reportName = this.localizationService.instant(
      '::Reports:ProductSalesByDeliveryType:ReportName',
    );

    const formattedBody = this.getFormattedBody(body);
    const { firstHeaderRow, secondHeaderRow } = this.getTableHeaders();
    const columnStyles = this.getColumnStyles();

    const mainTableY = this.reportConfig.tableStartY + 25;

    autoTable(doc, {
      startY: mainTableY,
      head: [firstHeaderRow, secondHeaderRow],
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
      if (this.reportCategory === ReportCategory.Summary) {
        return [
          row[0],
          `$${row[1]}`,
          row[2],
          `$${row[3]}`,
          `$${row[4]}`,
          row[5],
          `$${row[6]}`,
          `$${row[7]}`,
          row[8],
          `$${row[9]}`,
          `$${row[10]}`,
          row[11],
          `$${row[12]}`,
          `$${row[13]}`,
          row[14],
          `$${row[15]}`,
        ];
      } else {
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
      }
    });
  }

  private getTableHeaders(): { firstHeaderRow: any[]; secondHeaderRow: string[] } {
    const productInfo = this.localizationService.instant(
      '::Reports:ProductSalesByOrderPlacement:ProductInfo',
    );
    const productDepartment = this.localizationService.instant(
      '::Reports:ProductSalesByOrderPlacement:ProductDepartment',
    );
    const overAllSales = this.localizationService.instant(
      '::Reports:ProductSalesByOrderPlacement:OverallSales',
    );
    const deliverySales = this.localizationService.instant(
      '::Reports:ProductSalesByDeliveryType:DeliverySales',
    );
    const carryOutSales = this.localizationService.instant(
      '::Reports:ProductSalesByDeliveryType:CarryOutSales',
    );
    const outgoingSales = this.localizationService.instant(
      '::Reports:ProductSalesByDeliveryType:OutGoingSales',
    );
    const othersSales = this.localizationService.instant(
      '::Reports:ProductSalesByDeliveryType:OthersSales',
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

    const firstHeaderRow =
      this.reportCategory === ReportCategory.Summary
        ? [
            {
              content: productInfo,
              colSpan: 1,
            },
            {
              content: overAllSales,
              colSpan: 3,
            },
            {
              content: deliverySales,
              colSpan: 3,
            },
            {
              content: carryOutSales,
              colSpan: 3,
            },
            {
              content: outgoingSales,
              colSpan: 3,
            },
            {
              content: othersSales,
              colSpan: 3,
            },
          ]
        : [
            {
              content: productInfo,
              colSpan: 2,
            },
            {
              content: overAllSales,
              colSpan: 3,
            },
            {
              content: deliverySales,
              colSpan: 3,
            },
            {
              content: carryOutSales,
              colSpan: 3,
            },
            {
              content: outgoingSales,
              colSpan: 3,
            },
            {
              content: othersSales,
              colSpan: 3,
            },
          ];

    const secondHeaderRow =
      this.reportCategory === ReportCategory.Summary
        ? [
            productDepartment,
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
          ]
        : [
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

    return { firstHeaderRow, secondHeaderRow };
  }

  private getColumnStyles() {
    const { salesAmtAndAvgWidth, unitsWidth } = this.reportConfig;

    if (this.reportCategory === ReportCategory.Summary) {
      const revisedSalesAmtAndAvgWidth = salesAmtAndAvgWidth + 1.5;

      return {
        0: { cellWidth: 20 },
        1: { cellWidth: revisedSalesAmtAndAvgWidth },
        2: { cellWidth: unitsWidth },
        3: { cellWidth: revisedSalesAmtAndAvgWidth },
        4: { cellWidth: revisedSalesAmtAndAvgWidth },
        5: { cellWidth: unitsWidth },
        6: { cellWidth: revisedSalesAmtAndAvgWidth },
        7: { cellWidth: revisedSalesAmtAndAvgWidth },
        8: { cellWidth: unitsWidth },
        9: { cellWidth: revisedSalesAmtAndAvgWidth },
        10: { cellWidth: revisedSalesAmtAndAvgWidth },
        11: { cellWidth: unitsWidth },
        12: { cellWidth: revisedSalesAmtAndAvgWidth },
        13: { cellWidth: revisedSalesAmtAndAvgWidth },
        14: { cellWidth: unitsWidth },
        15: { cellWidth: revisedSalesAmtAndAvgWidth },
      };
    }

    return {
      0: { cellWidth: 15 },
      1: { cellWidth: 20 },
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

    const byDelDate = this.localizationService.instant(
      '::Reports:ProductSalesByOrderPlacement:ByDelDate',
    );
    doc.text(byDelDate, 90, this.reportConfig.filterSectionY);

    const wholesaleText = this.localizationService.instant(
      '::Reports:ProductSalesByOrderPlacement:Wholesale',
    );
    doc.text(wholesaleText, 190, this.reportConfig.filterSectionY);
  }

  private getReportBody(orders: SubOrderControlListDto[]) {
    const groupedOrders = {
      DeliverySales: this.filterAndGroupOrdersByDeliveryCategory(
        orders,
        DeliveryCategory.Recipient,
      ),
      CarryOutSales: this.filterAndGroupOrdersByDeliveryCategory(orders, DeliveryCategory.CarryOut),
      OutGoingSales: this.filterAndGroupOrdersByDeliveryCategory(orders, null),
      OthersSales: this.filterAndGroupOrdersByDeliveryCategory(orders, DeliveryCategory.WillCall),
    };

    const productWiseOrders = orders.reduce<Record<string, SubOrderControlListDto>>(
      (grouped, order) => {
        const key =
          this.reportCategory === ReportCategory.Summary
            ? order.departmentValueId
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
      {},
    );

    let totalUnitPrice = { DeliverySales: 0, CarryOutSales: 0, OutGoingSales: 0, OthersSales: 0 };
    let totalUnits = { DeliverySales: 0, CarryOutSales: 0, OutGoingSales: 0, OthersSales: 0 };

    const bodyContents = Object.entries(productWiseOrders).map(([key, orderInfo]) => {
      const isSummary = this.reportCategory === ReportCategory.Summary;
      const groupingKey = isSummary ? orderInfo.departmentValueId : orderInfo.productCode;
      const productDepartmentName = orderInfo.departmentValueName || '';

      const orderData = Object.keys(groupedOrders).reduce((acc, orderKey) => {
        const order = groupedOrders[orderKey][groupingKey] || {
          totalUnits: 0,
          totalUnitPrice: 0,
          avgUnitPrice: 0,
        };

        totalUnitPrice[orderKey] = (totalUnitPrice[orderKey] || 0) + order.totalUnitPrice;
        totalUnits[orderKey] = (totalUnits[orderKey] || 0) + order.totalUnits;

        acc.push(order.totalUnitPrice.toFixed(2), order.totalUnits, order.avgUnitPrice.toFixed(2));
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

      return isSummary
        ? [
            productDepartmentName,
            totalOrderUnitPrice.toFixed(ROUNDING_PRECISION),
            totalOrderUnits,
            avgUnitPrice.toFixed(ROUNDING_PRECISION),
            ...orderData,
          ]
        : [
            groupingKey,
            orderInfo.productDescription || '',
            totalOrderUnitPrice.toFixed(ROUNDING_PRECISION),
            totalOrderUnits,
            avgUnitPrice.toFixed(ROUNDING_PRECISION),
            ...orderData,
          ];
    });

    this.addLocationTotal(
      totalUnits.DeliverySales,
      totalUnitPrice.DeliverySales,
      totalUnits.CarryOutSales,
      totalUnitPrice.CarryOutSales,
      totalUnits.OutGoingSales,
      totalUnitPrice.OutGoingSales,
      totalUnits.OthersSales,
      totalUnitPrice.OthersSales,
      bodyContents,
    );

    return bodyContents;
  }

  private addLocationTotal(
    totalDeliverySalesUnits: number,
    totalDeliverySalesUnitPrice: number,
    totalCarryOutSalesUnits: number,
    totalCarryOutSalesUnitPrice: number,
    totalOutGoingSalesUnits: number,
    totalOutGoingSalesUnitPrice: number,
    totalOthersSalesUnits: number,
    totalOthersSalesUnitPrice: number,
    bodyContents: any[],
  ) {
    const locationTotalText = this.localizationService.instant(
      '::Reports:ProductSalesByOrderPlacement:SubTotal',
    );

    const avgDeliverySalesUnitPrice = totalDeliverySalesUnits
      ? totalDeliverySalesUnitPrice / totalDeliverySalesUnits
      : 0;
    const avgCarryOutSalesUnitPrice = totalCarryOutSalesUnits
      ? totalCarryOutSalesUnitPrice / totalCarryOutSalesUnits
      : 0;
    const avgOutGoingSalesUnitPrice = totalOutGoingSalesUnits
      ? totalOutGoingSalesUnitPrice / totalOutGoingSalesUnits
      : 0;
    const avgOthersSalesUnitPrice = totalOthersSalesUnits
      ? totalOthersSalesUnitPrice / totalOthersSalesUnits
      : 0;

    const totalUnits =
      totalDeliverySalesUnits +
      totalCarryOutSalesUnits +
      totalOutGoingSalesUnits +
      totalOthersSalesUnits;
    const totalUnitPrice =
      totalDeliverySalesUnitPrice +
      totalCarryOutSalesUnitPrice +
      totalOutGoingSalesUnitPrice +
      totalOthersSalesUnitPrice;
    const avgTotalUnitPrice = totalUnits ? totalUnitPrice / totalUnits : 0;

    const rowData = [
      locationTotalText,
      totalUnitPrice.toFixed(ROUNDING_PRECISION),
      totalUnits,
      avgTotalUnitPrice.toFixed(ROUNDING_PRECISION),
      totalDeliverySalesUnitPrice.toFixed(ROUNDING_PRECISION),
      totalDeliverySalesUnits,
      avgDeliverySalesUnitPrice.toFixed(ROUNDING_PRECISION),
      totalCarryOutSalesUnitPrice.toFixed(ROUNDING_PRECISION),
      totalCarryOutSalesUnits,
      avgCarryOutSalesUnitPrice.toFixed(ROUNDING_PRECISION),
      totalOutGoingSalesUnitPrice.toFixed(ROUNDING_PRECISION),
      totalOutGoingSalesUnits,
      avgOutGoingSalesUnitPrice.toFixed(ROUNDING_PRECISION),
      totalOthersSalesUnitPrice.toFixed(ROUNDING_PRECISION),
      totalOthersSalesUnits,
      avgOthersSalesUnitPrice.toFixed(ROUNDING_PRECISION),
    ];

    if (this.reportCategory === ReportCategory.Details) {
      rowData.unshift('');
    }

    bodyContents.push(rowData);
  }

  private filterAndGroupOrdersByDeliveryCategory(
    orders: SubOrderControlListDto[],
    deliveryCategory?: DeliveryCategory,
  ): Record<string, SubOrderControlListDto> {
    const orderTypes = deliveryCategory ? [OrderType.SW, OrderType.SO] : [OrderType.WO];

    return orders
      .filter(c => {
        if (deliveryCategory) {
          return c.deliveryCategory === deliveryCategory && orderTypes.includes(c.orderType);
        } else {
          return orderTypes.includes(c.orderType);
        }
      })
      .reduce(
        (grouped, order) => {
          const key =
            this.reportCategory === ReportCategory.Summary
              ? order.departmentValueId
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

  private getFilterTableBody(input: FilterPagedAndSortedOrderControlListResultRequestDto): any[][] {
    const allSelectionText = this.localizationService.instant(
      '::Reports:OrderReport:Filter:AllSelect',
    );
    const fromDate = input.fromDate ? new Date(input.fromDate).toLocaleDateString() : '';
    const toDate = input.toDate ? new Date(input.toDate).toLocaleDateString() : '';
    const filterDateRange = this.localizationService.instant('::Reports:Common:DateRange');
    const dateRangeText = filterDateRange.replace('{0}', fromDate).replace('{1}', toDate);
    const selectedDateInfo = fromDate && toDate ? dateRangeText : '';

    const productNames = formatFilterItem(this.selectedProductNames, allSelectionText);
    const productDepartmentNames = formatFilterItem(
      this.selectedProductDepartmentNames,
      allSelectionText,
    );
    const storeNames = formatFilterItem(this.selectedStoreNames, allSelectionText);
    const salesTypes = formatFilterItem(this.selectedSalesTypes, allSelectionText);

    const dateFilter = this.localizationService.instant('::Reports:OrderReport:Filter:Date');
    const productTypeFilter = this.localizationService.instant(
      '::Reports:ProductSalesByDeliveryType:Filter:Product',
    );
    const productDeptFilter = this.localizationService.instant(
      '::Reports:OrderReport:Filter:ProductDepartment',
    );
    const salesTypeFilter = this.localizationService.instant(
      '::Reports:ProductSalesByOrderPlacement:Filter:SalesTypes',
    );
    const storesFilter = this.localizationService.instant('::Reports:OrderReport:Filter:Stores');

    return [
      [dateFilter, selectedDateInfo, productTypeFilter, productNames],
      [productDeptFilter, productDepartmentNames, storesFilter, storeNames],
      [salesTypeFilter, salesTypes],
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
