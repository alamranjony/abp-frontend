import { Component, Inject, Injectable, OnDestroy, OnInit } from '@angular/core';
import {
  catchError,
  filter,
  firstValueFrom,
  forkJoin,
  map,
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import {
  getEnumDisplayName,
  getFormatedDate,
  getFormatedTime,
  sortEnumValues,
} from 'src/app/shared/common-utils';
import { SharedModule } from 'src/app/shared/shared.module';
import { PrintOption, printOptions } from './enums/print-option.enum';
import { ToasterService } from '@abp/ng.theme.shared';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  DeliveryCategory,
  OrderType,
  SubOrderControlListDto,
  SubOrderService,
} from '@proxy/orders';
import trebucFont from 'src/assets/fonts/trebuc-normal.js';
import jsPDF from 'jspdf';
import {
  REPORT_BOLD_FONT_FILE_NAME,
  REPORT_BOLD_FONT_TYPE,
  REPORT_FONT_FILE_NAME,
  REPORT_FONT_NAME,
  REPORT_FONT_TYPE,
} from 'src/app/shared/constants';
import autoTable from 'jspdf-autotable';
import { PaymentMethod } from '@proxy/payment';
import trebucBoldFont from 'src/assets/fonts/trebuc-bold.js';
import { LocalizationService } from '@abp/ng.core';
import { CreatePrintJobDto, PrintJobType, PrintNodeService } from '@proxy/print-node';
import { PosPrintService } from '@proxy/pos-printing';
import { SharedDataService } from '../shared-data.service';
import { PrintDesignOrderService } from 'src/app/services/print-design-order.service';
import {
  fontFamilyTypeOptions,
  fontStyleTypeOptions,
} from '@proxy/settings/store-specific-settings';
import { occasionsTypeOptions } from 'src/app/models/occasionsType-enum';
import { BarcodeGeneratorService } from 'src/app/services/bar-code-generator.service';

@Component({
  selector: 'app-pos-print-order-dialog',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './pos-print-order-dialog.component.html',
  styleUrl: './pos-print-order-dialog.component.scss',
})
@Injectable({ providedIn: 'root' })
export class PosPrintOrderDialogComponent implements OnInit, OnDestroy {
  destroy$ = new Subject<void>();
  sendEmail = false;
  printOptions = sortEnumValues(printOptions);
  selectedOption = 0;
  selectedSubOrderIds: string[] = [];

  constructor(
    private dialogRef: MatDialogRef<PosPrintOrderDialogComponent>,
    private readonly localizationService: LocalizationService,
    private readonly toasterService: ToasterService,
    private readonly printNodeService: PrintNodeService,
    private readonly posPrintService: PosPrintService,
    private readonly sharedDataService: SharedDataService,
    private readonly printDesignOrderService: PrintDesignOrderService,
    private readonly subOrderService: SubOrderService,
    @Inject(MAT_DIALOG_DATA) public data: { orderId: string },
    private readonly barCodeService: BarcodeGeneratorService,
  ) {}

  ngOnInit(): void {
    this.sharedDataService.selectedSubOrderIds$.pipe(takeUntil(this.destroy$)).subscribe(x => {
      this.selectedSubOrderIds = x;
    });
  }

  onConfirm(): void {
    switch (this.selectedOption) {
      case PrintOption.OrderWithNotepadDetails:
        this.handleOrderWithNotepadDetails();
        break;
      case PrintOption.OrderWithoutNotepadDetails:
        this.handleOrderWithoutNotepadDetails();
        break;
      case PrintOption.CustomerCopy:
        this.handleCustomerCopy(this.data.orderId);
        break;
      case PrintOption.PrintCardMessage:
        this.handlePrintCardMessage();
        break;
      case PrintOption.PrintPOSReceipt:
        this.handlePrintPOSReceipt();
        break;
      default:
        this.toasterService.error('::PrintOptions:Error');
    }

    if (this.sendEmail) {
      this.sendEmailNotification();
    }
  }

  private handleOrderWithNotepadDetails(): void {
    if (this.selectedSubOrderIds?.length === 0) {
      this.toasterService.error('::PrintOptions:NoOrderSelected');
      return;
    }

    this.printCommonOrderWithNotepad();
  }

  private handleOrderWithoutNotepadDetails(): void {
    if (this.selectedSubOrderIds?.length === 0) {
      this.toasterService.error('::PrintOptions:NoOrderSelected');
      return;
    }

    this.printCommonOrderWithNotepad(false);
  }

  printCommonOrderWithNotepad(isNotepad: boolean = true): void {
    let pdfList = [];
    let customerEmail = '';

    this.posPrintService
      .getSubOrdersWithOptionalNotepad(this.selectedSubOrderIds, isNotepad)
      .pipe(
        takeUntil(this.destroy$),
        filter(subOrders => subOrders.length > 0),
        switchMap(subOrders => {
          const printJobs$ = ([] as Observable<string | null>[]).concat(
            ...subOrders.map(subOrder => {
              const jobs: Observable<string | null>[] = [];
              const doc = this.printDesignOrderService.generateOrderWithBarcode(subOrder);
              const orderPrintJob: CreatePrintJobDto = {
                source: 'order-copy-print',
                printJobType: PrintJobType.HotshotPriorityOrder,
                base64Content: doc.output('datauristring').split(',')[1],
              } as CreatePrintJobDto;
              pdfList.push(orderPrintJob.base64Content);
              customerEmail = subOrder.customerPrimaryEmail;
              jobs.push(
                this.printNodeService.createPrintJob(orderPrintJob).pipe(
                  tap(() => this.toasterService.success('::InvoicePrint:PrintSuccess')),
                  map(() => subOrder.subOrderId),
                  catchError(() => {
                    this.toasterService.error('::InvoicePrint:PrintError');
                    return of(null);
                  }),
                ),
              );

              if (subOrder.isPrintCardTemplateWithOrderCopy) {
                const cardPdf = this.generateCardMessageTemplate(subOrder);
                const cardPrintJob: CreatePrintJobDto = {
                  source: 'card-message-print',
                  printJobType: PrintJobType.LocalOrder,
                  base64Content: cardPdf.output('datauristring').split(',')[1],
                } as CreatePrintJobDto;
                jobs.push(
                  this.printNodeService.createPrintJob(cardPrintJob).pipe(
                    tap(() => this.toasterService.success('::InvoicePrint:PrintSuccess')),
                    map(() => subOrder.subOrderId),
                    catchError(() => {
                      this.toasterService.error('::InvoicePrint:PrintError');
                      return of(null);
                    }),
                  ),
                );
              }
              return jobs;
            }),
          );

          return forkJoin(printJobs$);
        }),
        switchMap((printedSubOrderIds: (string | null)[]) => {
          const filteredIds = printedSubOrderIds.filter(id => !!id) as string[];
          if (filteredIds.length === 0) return of(null);

          return this.subOrderService.updateSubOrdersDesignStatus(filteredIds).pipe(
            tap(() => this.dialogRef.close()),
            catchError(() => {
              this.toasterService.error('::OrderCopy:DesignStatusUpdateError');
              return of(null);
            }),
          );
        }),

        switchMap(() => {
          if (!this.sendEmail || pdfList.length <= 0) return of(null);
          return this.posPrintService.sendEmailWithPdfAttachment(customerEmail, pdfList, 'order');
        }),
      )
      .subscribe({
        next: () => {
          if (this.sendEmail) this.toasterService.success('::PrintOptions:EmailSendSuccess');
          this.dialogRef.close();
        },
        error: () => {
          this.toasterService.error('::PrintOptions:EmailSendError');
        },
      });
  }

  public handleCustomerCopy(orderId: string): void {
    this.posPrintService
      .getPosPrintDataList(orderId)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(subOrderList => {
          if (!subOrderList.length) {
            return;
          }
          const logoSrc = subOrderList[0].invoiceImage;
          return this.loadImageAsync$(logoSrc).pipe(map(logoImg => ({ subOrderList, logoImg })));
        }),
        switchMap(({ subOrderList, logoImg }) => {
          const doc = this.generateInvoicePdf(subOrderList, logoImg);
          const printJobDto: CreatePrintJobDto = {
            source: 'invoice-print',
            printJobType: PrintJobType.InvoiceCopy,
            base64Content: doc.output('datauristring').split(',')[1],
          } as CreatePrintJobDto;

          return this.printNodeService
            .createPrintJob(printJobDto)
            .pipe(map(() => ({ subOrderList, doc })));
        }),
        switchMap(({ subOrderList, doc }) => {
          this.toasterService.success('::InvoicePrint:PrintSuccess');
          if (this.sendEmail && subOrderList[0].customerPrimaryEmail?.length > 0) {
            const pdfList = [doc.output('datauristring').split(',')[1]];
            return this.posPrintService.sendEmailWithPdfAttachment(
              subOrderList[0].customerPrimaryEmail,
              pdfList,
              'invoice',
            );
          }
          return of(null);
        }),
      )
      .subscribe({
        next: () => {
          if (this.sendEmail) {
            this.toasterService.success('::PrintOptions:EmailSendSuccess');
          }
          this.dialogRef.close();
        },
        error: () => {
          this.toasterService.error('::InvoicePrint:PrintError');
        },
      });
  }

  private generateInvoicePdf(
    subOrderList: SubOrderControlListDto[],
    logoImage: HTMLImageElement | null,
  ): jsPDF {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    this.useTrebucFont(doc);

    if (logoImage) {
      doc.addImage(logoImage, 'auto', 150, 2, 50, 30);
    }
    const subOrder = subOrderList[0];
    this.loadInvoiceDetails(subOrderList, subOrder, doc, subOrder.orderType === OrderType.IV);

    return doc;
  }

  private drawRightAlignedCurrency(
    doc: jsPDF,
    label: string,
    value: number,
    y: number,
    isBold: boolean,
    labelX: number,
    valueX: number,
    lineHeight: number,
    boldFontSize: number,
    useBoldFont: (doc: jsPDF) => void,
  ): number {
    const valueStr = value.toFixed(2);
    const [dollars, cents] = valueStr.split('.');
    const anchorX = valueX + 12;
    const dollarText = `$${dollars}`;
    const centsText = `.${cents}`;
    const dollarWidth = doc.getTextWidth(dollarText);
    const dollarX = anchorX - doc.getTextWidth(centsText) - dollarWidth;
    const centsX = anchorX - doc.getTextWidth(centsText);

    if (isBold) {
      useBoldFont(doc);
      doc.setFontSize(boldFontSize);
    }

    doc.text(label, labelX, y);
    doc.text(dollarText, dollarX + 14, y);
    doc.text(centsText, centsX + 14, y);

    return y + lineHeight;
  }

  private drawWrappedTextBox(
    doc: jsPDF,
    text: string,
    x: number,
    y: number,
    width: number,
    padding: number,
    lineHeight: number,
    pageHeight: number,
    pageTop: number,
    pageBottom: number,
  ): { rectHeight: number; startingY: number } {
    const modifiedText = text?.length ? `*** ${text} ***` : '-';
    const wrappedText = doc.splitTextToSize(modifiedText, width - 2 * padding);
    const contentHeight = wrappedText.length * lineHeight;

    if (y + contentHeight + 20 > pageHeight - pageBottom) {
      doc.addPage();
      y = pageTop;
    }

    let textY = y;
    wrappedText.forEach(line => {
      doc.text(line, x + padding, textY);
      textY += lineHeight;
    });

    return { rectHeight: contentHeight, startingY: y };
  }

  private drawFooterMessage(
    doc: jsPDF,
    text: string,
    y: number,
    pageWidth: number,
    lineHeight: number,
  ): void {
    const maxTextWidth = pageWidth - 40;
    const centerX = pageWidth / 2;
    const wrappedLines = doc.splitTextToSize(text, maxTextWidth);
    wrappedLines.forEach((line, i) => {
      doc.text(line, centerX, y + i * lineHeight, { align: 'center' });
    });
  }

  private loadImageAsync$(src: string): Observable<HTMLImageElement | null> {
    if (!src) return null;

    return new Observable(observer => {
      const img = new Image();
      img.onload = () => {
        observer.next(img);
        observer.complete();
      };
      img.onerror = () => {
        observer.next(null);
        observer.complete();
      };
      img.src = src;
    });
  }

  private loadInvoiceDetails(
    subOrderList: SubOrderControlListDto[],
    subOrder: SubOrderControlListDto,
    doc: jsPDF,
    isIVOrder: boolean = false,
  ) {
    const LEFT_MARGIN = 10;
    const RIGHT_MARGIN = 10;
    const RIGHT_LABEL_X = 135;
    const RIGHT_VALUE_X = 175;
    const PAGE_TOP_MARGIN = 10;
    const PAGE_BOTTOM_MARGIN = 10;
    const ADDRESS_LENGTH = 60;

    const FONT_SIZE_TITLE = 12;
    const FONT_SIZE_BODY = 10;
    const FONT_SIZE_SMALL = 8;
    const FONT_SIZE_TOTAL = 9;

    const BG_HEIGHT = 6;
    const LINE_HEIGHT = 6;
    const WRAPPED_LINE_HEIGHT = 5;

    const RECT_WIDTH = 110;
    const RECT_PADDING = 2;

    const INITIAL_VERTICAL_HEIGHT = 21;

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = INITIAL_VERTICAL_HEIGHT;

    this.useTrebucBoldFont(doc);
    doc.setFontSize(FONT_SIZE_TITLE);
    doc.text(`${subOrder.originalStoreName}`, LEFT_MARGIN, y);

    this.useTrebucFont(doc);
    doc.setFontSize(FONT_SIZE_BODY);

    const wrappedStoreAddress = doc.splitTextToSize(subOrder.storeAddress, ADDRESS_LENGTH);
    doc.text(wrappedStoreAddress, LEFT_MARGIN, y + LINE_HEIGHT);
    y = subOrder.storeAddress.length >= ADDRESS_LENGTH ? 45 : 40;

    this.useTrebucBoldFont(doc);
    doc.setFontSize(FONT_SIZE_TITLE);
    doc.setFillColor('#BDBDBD');
    doc.rect(LEFT_MARGIN - 2, y - 4, pageWidth - LEFT_MARGIN - RIGHT_MARGIN + 2, BG_HEIGHT, 'F');
    doc.setTextColor(0);
    doc.text(
      `${this.localizationService.instant('::InvoicePrint:Transaction')} ${subOrder.transactionNumber}`,
      LEFT_MARGIN,
      y,
    );
    y += LINE_HEIGHT + 2;

    this.useTrebucFont(doc);
    doc.setFontSize(FONT_SIZE_BODY);
    this.useTrebucBoldFont(doc);
    doc.text(this.localizationService.instant('::InvoicePrint:BilledTo'), LEFT_MARGIN, y);
    let rightAlignmentY = y;
    y += LINE_HEIGHT;

    this.useTrebucFont(doc);
    doc.text(`${subOrder.customerName}`, LEFT_MARGIN, y);
    y += LINE_HEIGHT;
    const wrappedCustomerAddress = doc.splitTextToSize(
      subOrder.customerFullAddress,
      ADDRESS_LENGTH,
    );
    doc.text(wrappedCustomerAddress, LEFT_MARGIN, y);
    y =
      subOrder.customerFullAddress.length >= ADDRESS_LENGTH
        ? ADDRESS_LENGTH + 21
        : ADDRESS_LENGTH + 17;

    doc.text(`${subOrder.customerPhoneNo}`, LEFT_MARGIN, y);
    if (subOrder.customerPrimaryEmail) {
      y += LINE_HEIGHT;
      doc.text(`${subOrder.customerPrimaryEmail}`, LEFT_MARGIN, y);
    }

    const formattedDate = getFormatedDate(subOrder.orderDate);

    doc.text(
      this.localizationService.instant('::Customer:BalanceDetails:OrderDate'),
      RIGHT_LABEL_X,
      rightAlignmentY,
    );
    doc.text(`${formattedDate}`, RIGHT_VALUE_X, rightAlignmentY);
    rightAlignmentY += LINE_HEIGHT;
    doc.text(
      this.localizationService.instant('::IndividualPayment.Fields.PaymentType'),
      RIGHT_LABEL_X,
      rightAlignmentY,
    );

    subOrder.paymentHistoriesDto.forEach((item, index) => {
      if (index !== 0) rightAlignmentY += LINE_HEIGHT;
      if (item.amountCharged > 0) {
        if (item.paymentMethod === PaymentMethod.Card) {
          doc.text(PaymentMethod[item.paymentMethod], RIGHT_VALUE_X, rightAlignmentY);
          rightAlignmentY += LINE_HEIGHT - 1;
          doc.setFontSize(FONT_SIZE_SMALL);
          doc.text(
            `${this.localizationService.instant('::InvoicePrint:CardType')} ${item.cardType}`,
            RIGHT_VALUE_X,
            rightAlignmentY,
          );
          rightAlignmentY += WRAPPED_LINE_HEIGHT;
          doc.text(
            `${this.localizationService.instant('::InvoicePrint:CardLastFourDigits')} ${item.cardLastFourDigits}`,
            RIGHT_VALUE_X,
            rightAlignmentY,
          );
          if (index !== subOrder.paymentHistoriesDto.length - 1) rightAlignmentY += LINE_HEIGHT;
          doc.setFontSize(FONT_SIZE_BODY);
        } else {
          doc.text(PaymentMethod[item.paymentMethod], RIGHT_VALUE_X, rightAlignmentY);
        }
      }
    });

    if (rightAlignmentY > y) y = rightAlignmentY;
    y += 10;

    const merchandiseTotal = subOrderList.reduce((sum, x) => sum + x.totalUnitPrice, 0);
    subOrderList.forEach(item => {
      if (y + 10 >= pageHeight - PAGE_BOTTOM_MARGIN) {
        doc.addPage();
        y = PAGE_TOP_MARGIN;
      }

      doc.setFillColor('#BDBDBD');
      doc.rect(LEFT_MARGIN - 2, y - 4, pageWidth - LEFT_MARGIN - RIGHT_MARGIN + 2, BG_HEIGHT, 'F');
      doc.setTextColor(0);
      doc.setFontSize(FONT_SIZE_TITLE);
      this.useTrebucBoldFont(doc);
      doc.text(
        `${this.localizationService.instant('::Customer:BalanceDetails:OrderNumber')}: ${item.orderNumber}`,
        LEFT_MARGIN,
        y,
      );
      y += LINE_HEIGHT + 2;

      this.useTrebucFont(doc);
      doc.setFontSize(FONT_SIZE_BODY);
      doc.text(
        `${this.localizationService.instant('::InvoicePrint:DeliveryTo')} ${item.recipientName}`,
        LEFT_MARGIN,
        y,
      );

      let formattedDeliveryDate: string;
      if (item.deliveryCategory === DeliveryCategory.CarryOut) {
        formattedDeliveryDate = item.deliveredDate ? getFormatedDate(item.deliveredDate) : '-';
      } else {
        formattedDeliveryDate = item.deliveryDate ? getFormatedDate(item.deliveryDate) : '-';
      }

      doc.text(
        this.localizationService.instant('::Customer:OrderHistory.DeliveryDate'),
        RIGHT_LABEL_X,
        y,
      );
      doc.text(`${formattedDeliveryDate}`, RIGHT_VALUE_X, y);
      y += LINE_HEIGHT;

      const recipientAddress =
        item.orderType !== OrderType.IV ? item.recipientFullAddress : item.customerFullAddress;
      const wrappedRecipientAddress = doc.splitTextToSize(recipientAddress, ADDRESS_LENGTH);
      doc.text(wrappedRecipientAddress, LEFT_MARGIN, y);
      if (recipientAddress) y = recipientAddress.length >= ADDRESS_LENGTH ? y + 18 : (y += 10);

      const phoneNo =
        item.orderType !== OrderType.IV ? item.recipientPhoneNo : item.customerPhoneNo;
      doc.text(`${phoneNo ?? ''}`, LEFT_MARGIN, y);
      if (phoneNo) y += LINE_HEIGHT;
      doc.text(`${item.cardMessage ?? ''}`, LEFT_MARGIN, y);
      if (item.cardMessage) y += LINE_HEIGHT;

      const estimatedTableHeight = 30 + subOrderList.length * 8;
      if (y + estimatedTableHeight > pageHeight - PAGE_BOTTOM_MARGIN) {
        doc.addPage();
        y = PAGE_TOP_MARGIN;
      }

      const productDetails = [
        [
          item.productCode,
          item.productDescription,
          item.quantity,
          `$${item.unitPrice.toFixed(2)}`,
          `$${item.totalUnitPrice.toFixed(2)}`,
        ],
      ];

      autoTable(doc, {
        startY: y,
        head: [
          [
            this.localizationService.instant('::Product.ProductCode'),
            this.localizationService.instant('::Reports:ProductRankingReport:ProductDescription'),
            this.localizationService.instant('::Recipe.Quantity'),
            this.localizationService.instant('::Pos:Price'),
            this.localizationService.instant('::InvoicePrint:Total'),
          ],
        ],
        body: productDetails,
        styles: { fontSize: FONT_SIZE_BODY, textColor: 0 },
        theme: 'grid',
        margin: { left: LEFT_MARGIN, right: RIGHT_MARGIN },
        headStyles: { fillColor: [215, 204, 200], textColor: 0 },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 20 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 },
        },
        didParseCell: data => {
          if ([3, 4].includes(data.column.index)) data.cell.styles.halign = 'right';
        },
      });

      y = (doc as any).lastAutoTable.finalY + 10;

      const { rectHeight, startingY } = this.drawWrappedTextBox(
        doc,
        subOrder.receiptTerms,
        LEFT_MARGIN,
        y,
        RECT_WIDTH,
        RECT_PADDING,
        WRAPPED_LINE_HEIGHT,
        pageHeight,
        PAGE_TOP_MARGIN,
        PAGE_BOTTOM_MARGIN,
      );
      y = startingY;
      const summary = [
        {
          label: this.localizationService.instant('::InvoicePrint:Merchandise'),
          value: item.totalUnitPrice,
        },
        {
          label: this.localizationService.instant('::Pos:DeliveryFee'),
          value: subOrderList.length > 1 ? item.itemDeliveryFee : item.deliveryFee,
        },
        {
          label: `${this.localizationService.instant('::Pos:Discount')}(${subOrder.discountType})`,
          value: subOrderList.length > 1 ? item.itemDiscount : item.discountAmount,
        },
        {
          label: `${this.localizationService.instant('::SalesRepDetailsReport:SalesTax')}(%)`,
          value: subOrderList.length > 1 ? item.itemTax : item.taxAmount,
        },
      ];

      if (subOrderList.length === 1) {
        summary.push({
          label: `${this.localizationService.instant('::ValueType:Child:Tip')}(${subOrder.tipType})`,
          value: subOrder.tipAmount,
        });
      }

      const subtotal =
        subOrderList.length > 1
          ? item.totalUnitPrice + item.itemDeliveryFee + item.itemTax - item.itemDiscount
          : subOrder.orderTotal;
      summary.push({
        label:
          subOrderList.length > 1
            ? this.localizationService.instant('::InvoicePrint:Subtotal')
            : this.localizationService.instant('::InvoicePrint:Total'),
        value: subtotal,
      });
      summary.forEach((row, index) => {
        if (row.value > 0) {
          const isBold = index === summary.length - 1;
          y = this.drawRightAlignedCurrency(
            doc,
            row.label,
            row.value,
            y,
            isBold,
            RIGHT_LABEL_X,
            RIGHT_VALUE_X,
            LINE_HEIGHT,
            FONT_SIZE_TOTAL,
            this.useTrebucBoldFont,
          );
        }
      });

      y += rectHeight / 2;
    });

    if (subOrderList.length > 1) {
      const transactionSummary = [
        {
          label: this.localizationService.instant('::InvoicePrint:Merchandise'),
          value: merchandiseTotal,
        },
        {
          label: `${this.localizationService.instant('::Pos:Discount')}(${subOrder.discountType})`,
          value: subOrder.discountAmount,
        },
        {
          label: `${this.localizationService.instant('::SalesRepDetailsReport:SalesTax')}(%)`,
          value: subOrder.taxAmount,
        },
        {
          label: `${this.localizationService.instant('::ValueType:Child:Tip')}(${subOrder.tipType})`,
          value: subOrder.tipAmount,
        },
        {
          label: this.localizationService.instant('::Pos:DeliveryFee'),
          value: subOrder.deliveryFee,
        },
        { label: this.localizationService.instant('::Pos:GrandTotal'), value: subOrder.orderTotal },
      ];

      const numberOfVisibleRows = transactionSummary.filter(row => row.value > 0).length;
      const transactionSummaryHeight = (1 + numberOfVisibleRows) * LINE_HEIGHT;

      if (y + transactionSummaryHeight >= pageHeight - PAGE_BOTTOM_MARGIN) {
        doc.addPage();
        y = PAGE_TOP_MARGIN;
      }

      doc.setFontSize(FONT_SIZE_TITLE);
      this.useTrebucBoldFont(doc);
      doc.text(
        this.localizationService.instant('::InvoicePrint:TransactionSummary'),
        RIGHT_LABEL_X,
        y,
      );
      y += LINE_HEIGHT;
      this.useTrebucFont(doc);
      doc.setFontSize(FONT_SIZE_BODY);

      transactionSummary.forEach((row, index) => {
        if (row.value > 0) {
          const isBold = index === transactionSummary.length - 1;
          y = this.drawRightAlignedCurrency(
            doc,
            row.label,
            row.value,
            y,
            isBold,
            RIGHT_LABEL_X,
            RIGHT_VALUE_X,
            LINE_HEIGHT,
            FONT_SIZE_TOTAL,
            this.useTrebucBoldFont,
          );
        }
      });
    }

    this.useTrebucFont(doc);
    doc.setFontSize(FONT_SIZE_BODY);
    const message = subOrder.receiptInvoiceMessage?.length
      ? `${subOrder.receiptInvoiceMessage} ${subOrder.storePhoneNumber}`
      : '';
    this.drawFooterMessage(doc, message, y + 5, pageWidth, WRAPPED_LINE_HEIGHT);

    if (isIVOrder) {
      this.generateBarcodeImageForIVOrder(doc, subOrder.orderNumber);
      this.addSignByText(doc);
    }

    const totalPages = doc.getNumberOfPages();
    if (totalPages > 1) {
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(FONT_SIZE_BODY);
        this.useTrebucFont(doc);
        const pageText = `Page ${i} of ${totalPages}`;
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.text(pageText, pageWidth - 20, pageHeight - 5);
      }
    }
  }

  private addSignByText(doc: jsPDF): void {
    this.useTrebucBoldFont(doc);
    const pageHeight = doc.internal.pageSize.getHeight();
    const signedByText = this.localizationService.instant('::InvoicePrint:SignedBy');
    doc.text(signedByText, 10, pageHeight - 20);
  }

  private generateBarcodeImageForIVOrder(doc: jsPDF, orderNo: number): void {
    const barcodeImage = this.barCodeService.generateBarcodeBase64(orderNo.toString());
    const pageHeight = doc.internal.pageSize.getHeight();
    const imageWidth = 60;
    const imageHeight = 15;
    doc.addImage(barcodeImage, 'PNG', 133, pageHeight - 30, imageWidth, imageHeight);
  }

  private useTrebucFont(doc: jsPDF): void {
    doc.addFileToVFS(REPORT_FONT_FILE_NAME, trebucFont);
    doc.addFont(REPORT_FONT_FILE_NAME, REPORT_FONT_NAME, REPORT_FONT_TYPE);
    doc.setFont(REPORT_FONT_NAME, REPORT_FONT_TYPE);
  }

  private useTrebucBoldFont(doc: jsPDF): void {
    doc.addFileToVFS(REPORT_BOLD_FONT_FILE_NAME, trebucBoldFont);
    doc.addFont(REPORT_BOLD_FONT_FILE_NAME, REPORT_FONT_NAME, REPORT_BOLD_FONT_TYPE);
    doc.setFont(REPORT_FONT_NAME, REPORT_BOLD_FONT_TYPE);
  }

  private handlePrintCardMessage(): void {
    if (this.selectedSubOrderIds?.length === 0) {
      this.toasterService.error('::PrintOptions:NoOrderSelected');
      return;
    }

    this.posPrintService
      .getSubOrdersWithCardTemplate(this.selectedSubOrderIds)
      .pipe(
        takeUntil(this.destroy$),
        filter(subOrders => Array.isArray(subOrders) && subOrders.length > 0),
        switchMap(subOrders => {
          const pdfList = subOrders.map(subOrder => {
            const doc = this.generateCardMessageTemplate(subOrder);
            return doc.output('datauristring').split(',')[1];
          });

          const printJobs$ = subOrders.map((subOrder, i) => {
            const printJob: CreatePrintJobDto = {
              source: 'card-message',
              printJobType: PrintJobType.LocalOrder,
              base64Content: pdfList[i],
            } as CreatePrintJobDto;
            return this.printNodeService.createPrintJob(printJob);
          });

          return forkJoin(printJobs$).pipe(map(() => ({ subOrders, pdfList })));
        }),
        switchMap(({ subOrders, pdfList }) => {
          if (!this.sendEmail) return of(null);
          let email = subOrders[0].customerPrimaryEmail;
          if (email.length <= 0) return of(null);
          return this.posPrintService.sendEmailWithPdfAttachment(email, pdfList, 'card-message');
        }),
      )
      .subscribe({
        next: () => {
          this.toasterService.success('::CardMessagePrint:Success');
          if (this.sendEmail) this.toasterService.success('Emails sent successfully');
        },
        error: () => {
          this.toasterService.error('::CardMessagePrint:Error');
        },
      });
  }

  generateCardMessageTemplate(subOrder: SubOrderControlListDto) {
    const cardDesignSetting = subOrder.cardDesignSettingDto;
    const doc = new jsPDF({
      unit: 'mm',
      format: [cardDesignSetting.templateWidth || 127, cardDesignSetting.templateHeight || 178],
    });

    if (cardDesignSetting.isCardMessage && subOrder.cardMessage) {
      const fontFamily = getEnumDisplayName(
        fontFamilyTypeOptions,
        cardDesignSetting.cardFontFamily,
      );
      const fontStyle = getEnumDisplayName(fontStyleTypeOptions, cardDesignSetting.cardFontStyle);
      doc.setFont(fontFamily, fontStyle);
      doc.setFontSize(cardDesignSetting.cardFontSize);
      doc.setTextColor(cardDesignSetting.cardMessageTextColor);

      const lines = subOrder.cardMessage.split('\n');
      const lineHeight = cardDesignSetting.cardFontSize * (cardDesignSetting.cardLineHeight || 1.2);

      let x = cardDesignSetting.cardMessageLeftMargin;
      let y = cardDesignSetting.cardMessageTopMargin;

      lines.forEach((line, index) => {
        doc.text(line, x, y + index * lineHeight, { maxWidth: cardDesignSetting.cardMessageWidth });
      });
    }

    if (cardDesignSetting.isRecipient && subOrder.recipientName) {
      const fontFamily = getEnumDisplayName(
        fontFamilyTypeOptions,
        cardDesignSetting.recipientFontFamily,
      );
      const fontStyle = getEnumDisplayName(
        fontStyleTypeOptions,
        cardDesignSetting.recipientFontStyle,
      );
      doc.setFont(fontFamily, fontStyle);
      doc.setFontSize(cardDesignSetting.recipientFontSize);
      doc.setTextColor(cardDesignSetting.recipientTextColor);

      doc.text(
        subOrder.recipientName,
        cardDesignSetting.recipientLeftMargin,
        cardDesignSetting.recipientTopMargin,
        { maxWidth: cardDesignSetting.recipientWidth },
      );
    }

    if (cardDesignSetting.isOccasion) {
      const fontFamily = getEnumDisplayName(
        fontFamilyTypeOptions,
        cardDesignSetting.occasionFontFamily,
      );
      const fontStyle = getEnumDisplayName(
        fontStyleTypeOptions,
        cardDesignSetting.occasionFontStyle,
      );
      const occasionType = getEnumDisplayName(occasionsTypeOptions, subOrder.occasionCode);
      doc.setFont(fontFamily, fontStyle);
      doc.setFontSize(cardDesignSetting.occasionFontSize);

      doc.text(
        occasionType,
        cardDesignSetting.occasionLeftMargin,
        cardDesignSetting.occasionTopMargin,
        { maxWidth: cardDesignSetting.occasionWidth },
      );
    }
    return doc;
  }

  private async handlePrintPOSReceipt(): Promise<void> {
    try {
      const subOrderList = await firstValueFrom(
        this.posPrintService.getPosPrintDataList(this.data.orderId).pipe(takeUntil(this.destroy$)),
      );

      const doc = await this.generatePOSReceipt(subOrderList);
      if (this.sendEmail && subOrderList[0].customerPrimaryEmail.length > 0) {
        const pdfList = [];
        const pdfBase64 = doc.output('datauristring').split(',')[1];
        pdfList.push(pdfBase64);

        await firstValueFrom(
          this.posPrintService.sendEmailWithPdfAttachment(
            subOrderList[0].customerPrimaryEmail,
            pdfList,
            'pos-receipt',
          ),
        );
      }
      this.dialogRef.close();
    } catch (error) {
      this.toasterService.error(error);
    }
  }

  generatePOSReceipt(subOrderList: SubOrderControlListDto[]): Promise<jsPDF> {
    return new Promise(resolve => {
      const BASE_HEIGHT = 200;
      const BASE_ITEMS = 3;
      const EXTRA_HEIGHT = 6;
      const MAX_TEXT_WIDTH = 60;
      const PAGE_WIDTH = 72;
      const IMAGE_WIDTH = 30;
      const IMAGE_HEIGHT = 20;
      const FONT_SIZE_NORMAL = 8;
      const FONT_SIZE_SMALL = 7;
      const ANCHOR_X = 66;
      const CENTER_X = 35;

      if (subOrderList.length === 0) {
        resolve(undefined);
        return;
      }

      const extraItems = Math.max(0, subOrderList.length - BASE_ITEMS);
      const totalHeight = BASE_HEIGHT + extraItems * EXTRA_HEIGHT;

      let doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [PAGE_WIDTH, totalHeight],
      });

      const subOrder = subOrderList[0];

      const drawContent = () => {
        let y = 0;
        y = this.drawStoreDetails(
          doc,
          subOrder,
          CENTER_X,
          MAX_TEXT_WIDTH,
          FONT_SIZE_NORMAL,
          y + IMAGE_HEIGHT + 4,
        );
        doc = this.renderRestOfReceipt(
          doc,
          subOrderList,
          subOrder,
          y,
          ANCHOR_X,
          CENTER_X,
          MAX_TEXT_WIDTH,
          FONT_SIZE_NORMAL,
          FONT_SIZE_SMALL,
        );
        resolve(doc);
      };

      if (subOrder.invoiceImage) {
        const logoImage = new Image();
        logoImage.src = subOrder.invoiceImage;

        logoImage.onload = () => {
          this.drawHeaderImage(doc, logoImage, PAGE_WIDTH, IMAGE_WIDTH, IMAGE_HEIGHT, 0);
          drawContent();
        };

        logoImage.onerror = () => {
          drawContent();
        };
      } else {
        drawContent();
      }
    });
  }

  private renderRestOfReceipt(
    doc: jsPDF,
    subOrderList: SubOrderControlListDto[],
    subOrder: SubOrderControlListDto,
    y: number,
    anchorX: number,
    centerX: number,
    maxTextWidth: number,
    fontSizeNormal: number,
    fontSizeSmall: number,
  ): jsPDF {
    y = this.drawTransactionInfo(doc, subOrder, y);
    y = this.drawProductTable(doc, subOrderList, y, anchorX);
    y = this.drawSummarySection(doc, subOrder, subOrderList, y, anchorX);
    y = this.drawPaymentSection(doc, subOrder, y, anchorX, fontSizeNormal, fontSizeSmall);
    y = this.drawDeliveryInfo(doc, subOrderList, y);
    y = this.drawReceiptFooterMessage(doc, subOrder.receiptMessage, y, centerX, maxTextWidth);

    window.open(doc.output('bloburl'), '_blank');
    return doc;
  }

  private drawHeaderImage(
    doc: jsPDF,
    image: HTMLImageElement,
    pageWidth: number,
    imgWidth: number,
    imgHeight: number,
    y: number,
  ) {
    const x = (pageWidth - imgWidth) / 2;
    doc.addImage(image, 'auto', x, y, imgWidth, imgHeight);
  }

  private drawStoreDetails(
    doc: jsPDF,
    subOrder: SubOrderControlListDto,
    centerX: number,
    maxTextWidth: number,
    fontSize: number,
    y: number,
  ): number {
    this.useTrebucFont(doc);
    doc.setFontSize(fontSize);
    doc.text(subOrder.originalStoreName ?? '-', centerX, y, { align: 'center' });
    y += 4;

    const wrappedStoreAddress = doc.splitTextToSize(subOrder.storeAddress ?? '-', maxTextWidth);
    doc.text(wrappedStoreAddress, centerX, y, { align: 'center' });

    y += 12;
    doc.text(subOrder.storePhoneNumber ?? '-', centerX, y, { align: 'center' });
    y += 4;
    doc.text(subOrder.storeEmail ?? '-', centerX, y, { align: 'center' });
    y += 6;
    return y;
  }

  private drawTransactionInfo(doc: jsPDF, subOrder: SubOrderControlListDto, y: number): number {
    doc.text(
      `${this.localizationService.instant('::ReceiptPrint:TrnId')}${subOrder.transactionNumber}`,
      2,
      y,
    );
    const wrappedClerkName = doc.splitTextToSize(subOrder.salesRepresentative ?? '-', 20);
    doc.text(this.localizationService.instant('::ReceiptPrint:Clerk'), 42, y);
    doc.text(wrappedClerkName, 50, y);
    y = subOrder.salesRepresentative.length >= 15 ? y + 7 : y + 4;

    doc.text(
      `${this.localizationService.instant('::Customer:BalanceDetails:OrderDate')}:${getFormatedDate(subOrder.orderDate)}`,
      2,
      y,
    );
    doc.text(
      `${this.localizationService.instant('::ReceiptPrint:Time')}${getFormatedTime(subOrder.orderDate)}`,
      42,
      y,
    );
    doc.line(2, y + 2, 70, y + 2);

    y += 6;
    return y;
  }

  private drawProductTable(
    doc: jsPDF,
    items: SubOrderControlListDto[],
    y: number,
    anchorX: number,
  ): number {
    this.useTrebucBoldFont(doc);

    doc.text(
      this.localizationService.instant('::Reports:ProductRankingReport:ProductDescription'),
      2,
      y,
    );
    doc.text(this.localizationService.instant('::Reports:ProductSalesComparisons:Units'), 35, y);
    doc.text(this.localizationService.instant('::ReceiptPrint:ExtAmount'), 50, y);
    y += 5;

    this.useTrebucFont(doc);

    items.forEach((item, index) => {
      doc.text(item.productName, 2, y);
      doc.text(item.quantity.toString(), 35, y);
      this.drawAmount(doc, item.totalUnitPrice, anchorX, y);

      if (index !== items.length - 1) y += 4;
    });

    y += 6;
    doc.line(2, y, 70, y);
    y += 4;

    return y;
  }

  private drawAmount(doc: jsPDF, value: number, anchorX: number, y: number) {
    const valueStr = value.toFixed(2);
    const [dollars, cents] = valueStr.split('.');
    const dollarText = `$${dollars}`;
    const centsText = `.${cents}`;
    const dollarWidth = doc.getTextWidth(dollarText);
    const centsWidth = doc.getTextWidth(centsText);
    const dollarX = anchorX - centsWidth - dollarWidth;
    const centsX = anchorX - centsWidth;

    doc.text(dollarText, dollarX, y);
    doc.text(centsText, centsX, y);
  }

  private drawSummarySection(
    doc: jsPDF,
    subOrder: SubOrderControlListDto,
    items: SubOrderControlListDto[],
    y: number,
    anchorX: number,
  ): number {
    const subTotal = items.reduce((sum, x) => sum + x.totalUnitPrice, 0);

    const summary = [
      { label: this.localizationService.instant('::InvoicePrint:Subtotal'), value: subTotal },
      {
        label: `${this.localizationService.instant('::Customer:Discount')}(${subOrder.discountType})`,
        value: subOrder.discountAmount,
      },
      {
        label: this.localizationService.instant('::ReceiptPrint:Tax'),
        value: subOrder.taxAmount,
      },
      {
        label: `${this.localizationService.instant('::ValueType:Child:Tip')}(${subOrder.tipType})`,
        value: subOrder.tipAmount,
      },
      {
        label: this.localizationService.instant('::Pos:DeliveryFee'),
        value: subOrder.deliveryFee,
      },
    ].filter(x => x.value > 0);

    summary.forEach((row, index) => {
      doc.text(row.label, 18, y);
      this.drawAmount(doc, row.value, anchorX, y);
      if (index !== summary.length - 1) y += 4;
    });

    doc.line(2, y + 2, 70, y + 2);
    y += 6;

    this.useTrebucBoldFont(doc);
    doc.text(this.localizationService.instant('::Pos:OrderItemColum:Total'), 18, y);
    this.drawAmount(doc, subOrder.orderTotal, anchorX, y);
    doc.line(2, y + 2, 68, y + 2);
    return y + 6;
  }

  private drawPaymentSection(
    doc: jsPDF,
    subOrder: SubOrderControlListDto,
    y: number,
    anchorX: number,
    fontSizeNormal: number,
    fontSizeSmall: number,
  ): number {
    this.useTrebucFont(doc);
    const payments = subOrder.paymentHistoriesDto;

    payments.forEach((item, index) => {
      let label = this.getPaymentMethodLabel(item.paymentMethod);

      if (item.amountCharged > 0 && label) {
        doc.text(label, 18, y);
        this.drawAmount(doc, item.amountCharged, anchorX, y);

        if (item.paymentMethod === PaymentMethod.Card) {
          y += 3;
          doc.setFontSize(fontSizeSmall);
          doc.text(
            `${this.localizationService.instant('::InvoicePrint:CardType')} ${item.cardType}`,
            18,
            y,
          );
          y += 3;
          doc.text(
            `${this.localizationService.instant('::InvoicePrint:CardLastFourDigits')} ${item.cardLastFourDigits}`,
            18,
            y,
          );
          y += 3;
          doc.text(
            `${this.localizationService.instant('::ReceiptPrint:AuthCode')}: ${item.authorizationCode}`,
            18,
            y,
          );
          doc.setFontSize(fontSizeNormal);
        }

        if (index !== payments.length - 1) y += 3;
      }
    });

    doc.line(2, y + 2, 68, y + 2);
    y += 6;

    this.useTrebucBoldFont(doc);
    doc.text(this.localizationService.instant('::ReceiptPrint:TotalAmountRendered'), 18, y);
    this.drawAmount(doc, subOrder.orderTotal, anchorX, y);
    y += 3;

    doc.text(this.localizationService.instant('::Pos:CashChangeDue'), 18, y);
    this.drawAmount(doc, subOrder.changeDueAmount, anchorX, y);
    doc.line(2, y + 2, 70, y + 2);
    return y + 6;
  }

  private drawDeliveryInfo(doc: jsPDF, items: SubOrderControlListDto[], y: number): number {
    doc.text(this.localizationService.instant('::ReceiptPrint:DeliverTo'), 2, y);
    doc.text(this.localizationService.instant('::ReceiptPrint:OrderNumber'), 30, y);
    doc.text(this.localizationService.instant('::Customer:OrderHistory.DeliveryDate'), 50, y);
    y += 4;

    this.useTrebucFont(doc);

    items.forEach((item, index) => {
      doc.text(item.recipientName ?? '-', 2, y);
      doc.text(item.orderNumber.toString(), 30, y);
      doc.text(item.deliveryDate ? getFormatedDate(item.deliveryDate) : '-', 52, y);
      if (index !== items.length - 1) y += 4;
    });

    return y + 5;
  }

  private drawReceiptFooterMessage(
    doc: jsPDF,
    message: string,
    y: number,
    centerX: number,
    maxTextWidth: number,
  ): number {
    const wrappedLines = doc.splitTextToSize(message ?? '', maxTextWidth);
    doc.text(wrappedLines, centerX, y, { align: 'center' });
    return y;
  }

  private getPaymentMethodLabel(method: PaymentMethod): string {
    switch (method) {
      case PaymentMethod.Cash:
        return this.localizationService.instant('::Pos:Cash');
      case PaymentMethod.Card:
        return this.localizationService.instant('::ReceiptPrint:CreditCard');
      case PaymentMethod.Check:
        return this.localizationService.instant('::Pos:Check');
      case PaymentMethod.GiftCard:
        return this.localizationService.instant('::Pos:GiftCard');
      case PaymentMethod.HouseAccount:
        return this.localizationService.instant('::Enum:PaymentMethod:HouseAccount');
      default:
        return '';
    }
  }

  private sendEmailNotification(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
