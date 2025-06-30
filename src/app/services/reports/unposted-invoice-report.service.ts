import { LocalizationService } from '@abp/ng.core';
import { ToasterService } from '@abp/ng.theme.shared';
import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { InvoiceReportingService } from '@proxy/invoice-reporting';
import { deliveryCategoryOptions, orderTypeOptions, SubOrderControlListDto } from '@proxy/orders';
import { PaymentMethod, paymentMethodOptions } from '@proxy/payment';
import { CreatePrintJobDto, PrintJobType, PrintNodeService } from '@proxy/print-node';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { getEnumDisplayName } from 'src/app/shared/common-utils';
import {
  REPORT_FONT_FILE_NAME,
  REPORT_FONT_NAME,
  REPORT_FONT_TYPE,
  REPORT_HEADER_BACKGROUND_COLOR,
  REPORT_HEADER_TEXT_COLOR,
} from 'src/app/shared/constants';
import { getCurrentTime } from 'src/app/shared/date-time-utils';
import trebucFont from 'src/assets/fonts/trebuc-normal.js';

type PaymentTypeTotals = {
  subTotal: number;
  discountAmount: number;
  deliveryFee: number;
  taxAmount: number;
  orderTotal: number;
};

@Injectable({
  providedIn: 'root',
})
export class UnpostedInvoiceReportService implements OnDestroy {
  private readonly logoUrl = 'assets/images/logo/ffc-logo.jpg';
  destroy$: Subject<void> = new Subject();
  reportName = 'Unposted Invoice List.pdf';

  constructor(
    private http: HttpClient,
    private localizationService: LocalizationService,
    private toasterService: ToasterService,
    private readonly printNodeService: PrintNodeService,
    private readonly invoiceReportingService: InvoiceReportingService,
  ) {}

  generateReport(fromDate: string, toDate: string, isPrint: boolean): void {
    forkJoin([
      this.invoiceReportingService.getUnpostedOrderListAndUpdateToPosted(fromDate, toDate),
      this.http.get(this.logoUrl, { responseType: 'blob' }),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([orderList, logo]) => {
        if (!orderList || orderList.length === 0) {
          this.toasterService.warn('::CustomerProductAnalysisReport:NotFound');
          return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(logo);
        reader.onloadend = () => {
          const logoBase64 = reader.result as string;
          const doc = this.generateUnpostedInvoiceListPdf(orderList, logoBase64, fromDate, toDate);

          if (!isPrint) {
            doc.save(this.reportName);
            return;
          }

          const orderPrintJob: CreatePrintJobDto = {
            source: 'unposted-invoice-list',
            printJobType: PrintJobType.LocalOrder,
            base64Content: doc.output('datauristring').split(',')[1],
          } as CreatePrintJobDto;

          const request = this.printNodeService.createPrintJob(orderPrintJob);
          request.pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
              this.toasterService.success('::InvoicePrint:PrintSuccess');
            },
            error: () => {
              this.toasterService.error('::InvoicePrint:PrintError');
            },
          });
        };
      });
  }

  generateUnpostedInvoiceListPdf(
    orderList: SubOrderControlListDto[],
    logo: string,
    fromDate: string,
    toDate: string,
  ): jsPDF {
    const doc = new jsPDF({
      orientation: 'landscape',
    });
    this.useTrebucFont(doc);
    doc.setFontSize(12);

    const orderListReportBody = this.getOrderListByPaymentGroup(orderList);
    this.designTableForOrderList(doc, orderListReportBody, fromDate, toDate, logo);
    return doc;
  }

  private addFilterTable(doc: jsPDF, filterBody: any[][]): void {
    autoTable(doc, {
      body: filterBody,
      startY: 40,
      theme: 'plain',
      styles: {
        fontSize: 11,
      },
      headStyles: {
        font: REPORT_FONT_NAME,
        fontStyle: REPORT_FONT_TYPE,
      },
      bodyStyles: {
        font: REPORT_FONT_NAME,
        fontStyle: REPORT_FONT_TYPE,
      },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'right', minCellWidth: 60 },
        1: { halign: 'left', minCellWidth: 80 },
        2: { fontStyle: 'bold', halign: 'right', minCellWidth: 55 },
        3: { halign: 'left', minCellWidth: 100 },
      },
    });
  }

  private getFilterTableBody(fromDate: string, toDate: string, isStoreRecap = false): any[][] {
    const startDate = new Date(fromDate).toLocaleDateString();
    const endDate = new Date(toDate).toLocaleDateString();
    const selectedDateInfo = fromDate && toDate ? `${startDate} To ${endDate}` : '';
    const storeRecap = isStoreRecap ? this.localizationService.instant('::Invoice:StoreRecap') : '';
    return [
      [this.localizationService.instant('::Reports:Common:FilterDate'), selectedDateInfo],
      ['', storeRecap],
    ];
  }

  private designTableForOrderList(
    doc: jsPDF,
    orderListReportBody: any,
    fromDate: string,
    toDate: string,
    logo: string,
  ): void {
    autoTable(doc, {
      head: [
        [
          this.localizationService.instant('::ReceiptPrint:OrderNumber'),
          this.localizationService.instant('::Customer:OrderHistory.OrderType'),
          this.localizationService.instant('::SalesRepDetailsReport:DelvMeth'),
          this.localizationService.instant('::SalesRepDetailsReport:TendType'),
          this.localizationService.instant('::Reports:OrderReport:SalesRep'),
          this.localizationService.instant('::Invoice:CustomerNoName'),
          this.localizationService.instant('::Invoicing:RecipientLastName'),
          this.localizationService.instant('::Customer:BalanceDetails:OrderDate'),
          this.localizationService.instant('::OrderControl:DeliveryDate'),
          this.localizationService.instant('::SalesRepDetailsReport:PostDate'),
          this.localizationService.instant('::SalesRepDetailsReport:MdSeAmount'),
          this.localizationService.instant('::SalesRepDetailsReport:DiscAmount'),
          this.localizationService.instant('::SalesRepDetailsReport:DelvCharge'),
          this.localizationService.instant('::SalesRepDetailsReport:SalesTax'),
          this.localizationService.instant('::Report:Column:TotalAmount'),
        ],
      ],
      headStyles: {
        font: REPORT_FONT_NAME,
        fontStyle: REPORT_FONT_TYPE,
        fillColor: REPORT_HEADER_BACKGROUND_COLOR,
        textColor: REPORT_HEADER_TEXT_COLOR,
      },
      bodyStyles: {
        font: REPORT_FONT_NAME,
        fontStyle: REPORT_FONT_TYPE,
      },
      didDrawPage: data => {
        this.addPageHeader(
          doc,
          logo,
          getCurrentTime(),
          data.pageNumber,
          this.localizationService.instant('::Invoicing:UnpostedInvoice'),
        );

        const filterBody = this.getFilterTableBody(fromDate, toDate);
        this.addFilterTable(doc, filterBody);
      },
      body: orderListReportBody,
      margin: { top: 50, left: (doc.internal.pageSize.width - 282) / 2 },
    });
  }

  private processOrders(
    orders: SubOrderControlListDto[],
    label: string,
    reportBody: any[][],
  ): void {
    if (orders.length > 0) {
      orders.forEach(item => {
        reportBody.push([
          item.subOrderNumber,
          getEnumDisplayName(orderTypeOptions, item.orderType),
          getEnumDisplayName(deliveryCategoryOptions, item.deliveryCategory),
          getEnumDisplayName(paymentMethodOptions, item.paymentMethod),
          item.salesRepresentative,
          item.customerName,
          item.recipientName,
          new Date(item.orderDate).toLocaleDateString(),
          item.deliveredDate ? new Date(item.deliveryDate).toLocaleDateString() : '-',
          new Date(item.postDate).toLocaleDateString(),
          '$' + item.unitPrice.toFixed(2),
          '$' + item.discountAmount.toFixed(2),
          '$' + item.deliveryFee.toFixed(2),
          '$' + item.taxAmount.toFixed(2),
          '$' + item.orderTotal.toFixed(2),
        ]);
      });

      const total = this.calculateTotalSum(orders);
      reportBody.push([
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        label,
        orders.length,
        '$' + total.subTotal.toFixed(2),
        '$' + total.discountAmount.toFixed(2),
        '$' + total.deliveryFee.toFixed(2),
        '$' + total.taxAmount.toFixed(2),
        '$' + total.orderTotal.toFixed(2),
      ]);
    }
  }

  private getOrderListByPaymentGroup(orderList: SubOrderControlListDto[]): [][] {
    const paymentMethods = [
      {
        method: PaymentMethod.Cash,
        label: this.localizationService.instant('::Pos:Cash'),
      },
      {
        method: PaymentMethod.Check,
        label: this.localizationService.instant('::Pos:Check'),
      },
      {
        method: PaymentMethod.Card,
        label: this.localizationService.instant('::Pos:Payment:CreditCard'),
      },
      {
        method: PaymentMethod.GiftCard,
        label: this.localizationService.instant('::Pos:GiftCard'),
      },
      {
        method: PaymentMethod.HouseAccount,
        label: this.localizationService.instant('::Enum:PaymentMethod:HouseAccount'),
      },
      {
        method: PaymentMethod.Unpaid,
        label: this.localizationService.instant('::Pos:Unpaid'),
      },
    ];

    const reportBody = [];

    paymentMethods.forEach(paymentMethod => {
      const orders = orderList.filter(o => o.paymentMethod === paymentMethod.method);
      this.processOrders(orders, paymentMethod.label, reportBody);
    });

    return reportBody;
  }

  private calculateTotalSum(orders: SubOrderControlListDto[]): PaymentTypeTotals {
    let totals: PaymentTypeTotals = {
      subTotal: 0,
      discountAmount: 0,
      deliveryFee: 0,
      taxAmount: 0,
      orderTotal: 0,
    };

    orders.forEach(item => {
      totals.subTotal += item.unitPrice;
      totals.discountAmount += item.discountAmount;
      totals.deliveryFee += item.deliveryFee;
      totals.taxAmount += item.taxAmount;
      totals.orderTotal += item.orderTotal;
    });

    return totals;
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
    doc.text(`Curr. Time: ${currentTime}  Page: ${pageNumber}`, pageWidth - marginRight, 15, {
      align: 'right',
    });
  }

  private addLogo(doc: jsPDF, logoBase64: string, headerTitle: string): void {
    doc.addImage(logoBase64, 'jpg', 123, 10, 50, 20);
    doc.setFontSize(14);
    doc.text(headerTitle, 148.5, 35, { align: 'center' });
  }

  private useTrebucFont(doc: jsPDF): void {
    doc.addFileToVFS(REPORT_FONT_FILE_NAME, trebucFont);
    doc.addFont(REPORT_FONT_FILE_NAME, REPORT_FONT_NAME, REPORT_FONT_TYPE);
    doc.setFont(REPORT_FONT_NAME, REPORT_FONT_TYPE);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
