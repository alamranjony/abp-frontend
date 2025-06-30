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
import {
  REPORT_FONT_FILE_NAME,
  REPORT_FONT_NAME,
  REPORT_FONT_TYPE,
  REPORT_HEADER_BACKGROUND_COLOR,
  REPORT_HEADER_TEXT_COLOR,
  ROUNDING_PRECISION,
} from '../shared/constants';
import { LocalizationService } from '@abp/ng.core';
import trebucFont from 'src/assets/fonts/trebuc-normal.js';
import { formatFilterItem } from './reports/reports-utils';

@Injectable({
  providedIn: 'root',
})
export class StoreSalesAnalysisReportService implements OnDestroy {
  private readonly logoUrl = 'assets/images/logo/ffc-logo.jpg';
  destroy$: Subject<void> = new Subject();
  readonly reportConfig = {
    imageX: 123,
    imageY: 10,
    imageWidth: 50,
    imageHeight: 20,
    filterTableFontSize: 12,
    tableCellPadding: 2,
    reportTitleFontSize: 18,
    reportTitleX: 148.5,
    reportTitleY: 40,
    tableYDefaultValue: 80,
    sectionHeaderHeight: 20,
    rowHeight: 10,
  };
  selectedStores: string[];
  selectedOrderTypes: string[];

  constructor(
    private http: HttpClient,
    private toasterService: ToasterService,
    private orderService: OrderService,
    private localizationService: LocalizationService,
  ) {}

  generateReport(
    input: FilterPagedAndSortedOrderControlListResultRequestDto,
    stores: string[],
    orderTypes: string[],
  ) {
    this.selectedStores = stores;
    this.selectedOrderTypes = orderTypes;

    forkJoin([
      this.orderService.generateStoreSalesAnalysisReport(input),
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
          this.generateStoreSalesAnalysisReportPdf(orders, logoBase64, input);
        };
      });
  }

  private generateStoreSalesAnalysisReportPdf(
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

    let currentY = this.reportConfig.tableYDefaultValue;
    const pageHeight = doc.internal.pageSize.height;
    let pageNumber = 1;

    const reportName = this.localizationService.instant('::Reports:StoreSalesAnalysis:ReportName');

    this.addPageHeader(doc, logoBase64, currentTime, pageNumber, reportName);
    const filterBody = this.getFilterTableBody(input);
    this.addFilterTable(doc, filterBody);

    let locationTotal = {
      amount: 0,
      deliveryFee: 0,
      relayFee: 0,
      taxAmount: 0,
      discountAmount: 0,
      tipAmount: 0,
      totalAmount: 0,
      totalUnits: 0,
    };

    const storeSalesEntries = Object.entries(this.groupOrdersByDate(orders));
    const totalEntries = storeSalesEntries.length;
    storeSalesEntries.forEach(([date, storeSales], index) => {
      let reportBody = this.getReportBody(storeSales);
      this.calculateLocationTotal(reportBody, locationTotal);

      if (index === totalEntries - 1) {
        this.addLocationTotalBody(locationTotal, reportBody);
      }

      const estimatedHeight =
        currentY +
        this.reportConfig.sectionHeaderHeight +
        reportBody.length * this.reportConfig.rowHeight;
      const availablePageHeight = pageHeight - this.reportConfig.rowHeight;
      if (estimatedHeight > availablePageHeight) {
        doc.addPage();
        currentY = this.reportConfig.tableYDefaultValue;
        pageNumber++;

        this.addPageHeader(doc, logoBase64, currentTime, pageNumber, reportName);
        this.addFilterTable(doc, filterBody);
      }

      this.addReportContents(doc, reportBody, date, currentY);

      currentY +=
        this.reportConfig.sectionHeaderHeight + reportBody.length * this.reportConfig.rowHeight;
    });

    const fileName = this.localizationService.instant(
      '::Reports:StoreSalesAnalysis:DownloadableFileName',
    );
    doc.save(fileName);
  }

  private addLocationTotalBody(
    locationTotal: {
      amount: number;
      deliveryFee: number;
      relayFee: number;
      taxAmount: number;
      discountAmount: number;
      tipAmount: number;
      totalAmount: number;
      totalUnits: number;
    },
    reportBody: any[],
  ) {
    const locationTotalLabel = this.localizationService.instant(
      '::Reports:StoreSalesAnalysis:LocationTotal',
    );
    const locationTotalRow = [
      locationTotalLabel,
      locationTotal.amount.toFixed(ROUNDING_PRECISION),
      locationTotal.deliveryFee.toFixed(ROUNDING_PRECISION),
      locationTotal.relayFee.toFixed(ROUNDING_PRECISION),
      locationTotal.taxAmount.toFixed(ROUNDING_PRECISION),
      locationTotal.discountAmount.toFixed(ROUNDING_PRECISION),
      locationTotal.tipAmount.toFixed(ROUNDING_PRECISION),
      locationTotal.totalAmount.toFixed(ROUNDING_PRECISION),
      locationTotal.totalUnits,
    ];
    reportBody.push(locationTotalRow);
  }

  private calculateLocationTotal(
    reportBody: any[],
    locationTotal: {
      amount: number;
      deliveryFee: number;
      relayFee: number;
      taxAmount: number;
      discountAmount: number;
      tipAmount: number;
      totalAmount: number;
      totalUnits: number;
    },
  ) {
    const subtotalRow = reportBody[reportBody.length - 1];
    subtotalRow.slice(1).forEach((value, i) => {
      if (i < 7) {
        locationTotal[Object.keys(locationTotal)[i]] += parseFloat(value);
      } else {
        locationTotal.totalUnits += parseInt(value);
      }
    });
  }

  private addReportContents(doc: jsPDF, body: (string | number)[][], date: string, startY: number) {
    const formattedBody = body.map(row => {
      return [
        row[0],
        `$${row[1]}`,
        `$${row[2]}`,
        `$${row[3]}`,
        `$${row[4]}`,
        `$${row[5]}`,
        `$${row[6]}`,
        `$${row[7]}`,
        row[8],
      ];
    });

    doc.setFontSize(14);
    doc.text(date, 14, startY - 10);

    const location = this.localizationService.instant('::Reports:StoreSalesAnalysis:Location');
    const merchandise = this.localizationService.instant(
      '::Reports:StoreSalesAnalysis:Merchandise',
    );
    const delivery = this.localizationService.instant('::Reports:StoreSalesAnalysis:Delivery');
    const relay = this.localizationService.instant('::Reports:StoreSalesAnalysis:Relay');
    const tax = this.localizationService.instant('::Reports:StoreSalesAnalysis:Tax');
    const discount = this.localizationService.instant('::Reports:StoreSalesAnalysis:Discount');
    const tipAmount = this.localizationService.instant('::Reports:StoreSalesAnalysis:TipAmount');
    const totalAmt = this.localizationService.instant('::Reports:StoreSalesAnalysis:TotalAmt');
    const numberOfOrders = this.localizationService.instant(
      '::Reports:StoreSalesAnalysis:NumberOfOrders',
    );

    autoTable(doc, {
      startY: startY - 5,
      head: [
        [
          location,
          merchandise,
          delivery,
          relay,
          tax,
          discount,
          tipAmount,
          totalAmt,
          numberOfOrders,
        ],
      ],
      body: formattedBody,
      margin: { top: startY - 5 },
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
    const groupedOrders = orders.reduce(
      (storeWiseOrder, order) => {
        const existingOrder = storeWiseOrder[order.originalStoreCode];
        if (existingOrder) {
          existingOrder.amount += order.amount;
          existingOrder.deliveryFee += order.deliveryFee;
          existingOrder.relayFee += order.relayFee;
          existingOrder.taxAmount += order.taxAmount;
          existingOrder.discountAmount += order.discountAmount;
          existingOrder.tipAmount += order.tipAmount;
          existingOrder.totalAmount += this.getOrderTotalAmount(order);
          existingOrder.totalUnits += order.totalUnits;
        } else {
          storeWiseOrder[order.originalStoreCode] = {
            ...order,
            totalAmount: this.getOrderTotalAmount(order),
            totalUnits: order.totalUnits,
          };
        }
        return storeWiseOrder;
      },
      {} as Record<string, SubOrderControlListDto>,
    );

    const body: any[] = [];
    Object.keys(groupedOrders).forEach(storeCode => {
      const order = groupedOrders[storeCode];
      body.push([
        order.originalStoreCode,
        order.amount.toFixed(ROUNDING_PRECISION),
        order.deliveryFee.toFixed(ROUNDING_PRECISION),
        order.relayFee.toFixed(ROUNDING_PRECISION),
        order.taxAmount.toFixed(ROUNDING_PRECISION),
        order.discountAmount.toFixed(ROUNDING_PRECISION),
        order.tipAmount.toFixed(ROUNDING_PRECISION),
        order.totalAmount.toFixed(ROUNDING_PRECISION),
        order.totalUnits,
      ]);
    });

    const subtotal = Object.values(groupedOrders).reduce(
      (acc, order) => {
        acc.amount += order.amount;
        acc.deliveryFee += order.deliveryFee;
        acc.relayFee += order.relayFee;
        acc.taxAmount += order.taxAmount;
        acc.discountAmount += order.discountAmount;
        acc.tipAmount += order.tipAmount;
        acc.totalAmount += order.totalAmount;
        acc.totalUnits += order.totalUnits;
        return acc;
      },
      {
        amount: 0,
        deliveryFee: 0,
        relayFee: 0,
        taxAmount: 0,
        discountAmount: 0,
        tipAmount: 0,
        totalAmount: 0,
        totalUnits: 0,
      },
    );

    const subTotal = this.localizationService.instant('::Reports:StoreSalesAnalysis:SubTotals');

    body.push([
      subTotal,
      subtotal.amount.toFixed(ROUNDING_PRECISION),
      subtotal.deliveryFee.toFixed(ROUNDING_PRECISION),
      subtotal.relayFee.toFixed(ROUNDING_PRECISION),
      subtotal.taxAmount.toFixed(ROUNDING_PRECISION),
      subtotal.discountAmount.toFixed(ROUNDING_PRECISION),
      subtotal.tipAmount.toFixed(ROUNDING_PRECISION),
      subtotal.totalAmount.toFixed(ROUNDING_PRECISION),
      subtotal.totalUnits,
    ]);

    return body;
  }

  private getOrderTotalAmount(order: SubOrderControlListDto) {
    return (
      order.amount +
      order.deliveryFee +
      order.relayFee +
      order.taxAmount +
      order.tipAmount -
      order.discountAmount
    );
  }

  private groupOrdersByDate(orders: SubOrderControlListDto[]): {
    [key: string]: SubOrderControlListDto[];
  } {
    return orders.reduce(
      (groupedOrders, order) => {
        const date = new Date(order.orderDate);
        const key = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });

        groupedOrders[key] = groupedOrders[key] || [];
        groupedOrders[key].push(order);

        return groupedOrders;
      },
      {} as { [key: string]: SubOrderControlListDto[] },
    );
  }

  private getFilterTableBody(input: FilterPagedAndSortedOrderControlListResultRequestDto): any[][] {
    const fromDate = input.fromDate ? new Date(input.fromDate).toLocaleDateString() : '';
    const toDate = input.toDate ? new Date(input.toDate).toLocaleDateString() : '';
    const filterDateRange = this.localizationService.instant('::Reports:Common:DateRange');
    const dateRangeText = filterDateRange.replace('{0}', fromDate).replace('{1}', toDate);
    const selectedDateInfo = fromDate && toDate ? dateRangeText : '';

    const allSelection = this.localizationService.instant('::Reports:Common:AllSelection');
    const storeNames = formatFilterItem(this.selectedStores, allSelection);
    const orderTypeNames = formatFilterItem(this.selectedOrderTypes, allSelection);

    const dateFilterName = this.localizationService.instant('::Reports:ProductRankingReport:Date');
    const storesFilterName = this.localizationService.instant(
      '::Reports:StoreSalesAnalysis:Stores',
    );
    const orderTypeFilterName = this.localizationService.instant(
      '::Reports:StoreSalesAnalysis:Filter:OrderType',
    );
    return [
      [dateFilterName, selectedDateInfo, storesFilterName, storeNames],
      [orderTypeFilterName, orderTypeNames],
    ];
  }

  private addFilterTable(doc: jsPDF, filterBody: any[][]): void {
    autoTable(doc, {
      body: filterBody,
      startY: 45,
      theme: 'plain',
      styles: {
        fontSize: this.reportConfig.filterTableFontSize,
        cellPadding: this.reportConfig.tableCellPadding,
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
