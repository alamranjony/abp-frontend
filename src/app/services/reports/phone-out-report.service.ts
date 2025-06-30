import { LocalizationService } from '@abp/ng.core';
import { ToasterService } from '@abp/ng.theme.shared';
import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { wireServiceOptions } from '@proxy/common';
import { InvoiceReportingService } from '@proxy/invoice-reporting';
import { OrderType, orderTypeOptions, SubOrderControlListDto } from '@proxy/orders';
import { PaymentMethod } from '@proxy/payment';
import { CreatePrintJobDto, PrintJobType, PrintNodeService } from '@proxy/print-node';
import { occasionCodeOptions } from '@proxy/recipients';
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

@Injectable({
  providedIn: 'root',
})
export class PhoneOutReportService implements OnDestroy {
  private readonly logoUrl = 'assets/images/logo/ffc-logo.jpg';
  destroy$: Subject<void> = new Subject();
  reportName = 'Transmit Phone Out Order.pdf';
  pageNumberArray = [];

  constructor(
    private http: HttpClient,
    private localizationService: LocalizationService,
    private toasterService: ToasterService,
    private readonly printNodeService: PrintNodeService,
    private readonly invoiceReportingService: InvoiceReportingService,
  ) {}

  generateReport(fromDate: string, toDate: string, isPrint: boolean): void {
    forkJoin([
      this.invoiceReportingService.getPhoneOutOrderList(fromDate, toDate),
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
          const doc = this.generatePhoneOutReportPdf(orderList, logoBase64, fromDate, toDate);

          if (!isPrint) {
            doc.save(this.reportName);
            return;
          }

          const orderPrintJob: CreatePrintJobDto = {
            source: 'transmit-phone-ins',
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

  generatePhoneOutReportPdf(
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

    let totalAmount = 0;

    const reportBody = [];
    orderList.forEach(item => {
      totalAmount += item.amount;
      reportBody.push([
        item.shopCode,
        item.shopName,
        item.shopPhone,
        getEnumDisplayName(wireServiceOptions, item.wireServiceType),
        new Date(item.deliveryDate).toLocaleDateString(),
        item.recipientName,
        getEnumDisplayName(occasionCodeOptions, item.occasionCode),
        '$' + item.amount,
        item.subOrderNumber,
      ]);
    });

    reportBody.push([
      '',
      '',
      '',
      '',
      '',
      this.localizationService.instant('::Invoice:TotalOrders'),
      ':',
      orderList.length,
      '$' + totalAmount.toFixed(2),
    ]);

    autoTable(doc, {
      head: [
        [
          this.localizationService.instant('::Shop:ShopCode'),
          this.localizationService.instant('::Invoice:ShopName'),
          this.localizationService.instant('::Invoice:ShopPhone'),
          this.localizationService.instant('::Invoice:WireService'),
          this.localizationService.instant('::OrderControl:DeliveryDate'),
          this.localizationService.instant('::RecipientName'),
          this.localizationService.instant('::OrderControl:OccasionType'),
          this.localizationService.instant('::IndividualPayment.Fields.Amount'),
          this.localizationService.instant('::SalesRepDetailsReport:OrderNo'),
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
          this.localizationService.instant('::Invoicing:WireServiceReport'),
        );

        const filterBody = this.getFilterTableBody(fromDate, toDate);
        this.addFilterTable(doc, filterBody);
      },
      body: reportBody,
      margin: { top: 50, left: (doc.internal.pageSize.width - 282) / 2 },
    });

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
        0: { fontStyle: 'bold', halign: 'right', minCellWidth: 55 },
        1: { halign: 'left', minCellWidth: 80 },
        2: { fontStyle: 'bold', halign: 'right', minCellWidth: 55 },
        3: { halign: 'left', minCellWidth: 100 },
      },
    });
  }

  private getFilterTableBody(fromDate: string, toDate: string): any[][] {
    const startDate = new Date(fromDate).toLocaleDateString();
    const endDate = new Date(toDate).toLocaleDateString();
    const selectedDateInfo = fromDate && toDate ? `${startDate} To ${endDate}` : '';
    return [[this.localizationService.instant('::Reports:Common:FilterDate'), selectedDateInfo]];
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
