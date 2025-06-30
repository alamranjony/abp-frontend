import { Injectable, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import trebucFont from 'src/assets/fonts/trebuc-normal.js';
import trebucBoldFont from 'src/assets/fonts/trebuc-bold.js';
import {
  REPORT_BOLD_FONT_FILE_NAME,
  REPORT_BOLD_FONT_TYPE,
  REPORT_FONT_FILE_NAME,
  REPORT_FONT_NAME,
  REPORT_FONT_TYPE,
} from 'src/app/shared/constants';
import { DesignStatus, orderTypeOptions, SubOrderControlListDto } from '@proxy/orders';
import { LocalizationService } from '@abp/ng.core';
import { BarcodeGeneratorService } from './bar-code-generator.service';
import { formatDateTime, getCurrentTime } from '../shared/date-time-utils';
import { orderNoteTypeOptions } from '@proxy/order-notes';
@Injectable({
  providedIn: 'root',
})
export class PrintDesignOrderService implements OnInit, OnDestroy {
  destroy$: Subject<void> = new Subject();

  constructor(
    private readonly localizationService: LocalizationService,
    private readonly barCodeService: BarcodeGeneratorService,
  ) {}

  ngOnInit(): void {}

  generateOrderWithBarcode(subOrder: SubOrderControlListDto): jsPDF {
    const initialHeight = 10;
    const horizontalDistance = 10;
    const horizontalRightDistance = 150;

    let verticalHeight = 30;

    const doc = new jsPDF();
    this.generateBarcodeImage(doc, initialHeight, true, subOrder.subOrderNumber);
    verticalHeight = this.generateOrderDeliveryDetailsTime(
      subOrder,
      doc,
      verticalHeight,
      horizontalDistance,
    );
    this.useTrebucFont(doc);

    this.generateStoreDetails(subOrder, doc, 30, horizontalRightDistance);
    doc.setFontSize(10);

    verticalHeight += 4;
    const pageWidth = doc.internal.pageSize.getWidth();

    if (subOrder.designStatus === DesignStatus.Print) {
      const text = this.localizationService.instant('::OrderCopy:Message');
      const textWidth = doc.getTextWidth(text);
      const x = (pageWidth - textWidth) / 2;
      doc.text(text, x, verticalHeight);
      verticalHeight += 4;
    }

    verticalHeight = this.showCustomerBasicInfo(subOrder, doc, verticalHeight, horizontalDistance);
    verticalHeight = this.showCustomerDetails(subOrder, doc, verticalHeight, horizontalDistance);
    verticalHeight = this.showProductTable(subOrder, doc, verticalHeight);
    verticalHeight = this.showChargeDetails(subOrder, doc, verticalHeight, horizontalDistance);
    if (subOrder.isRecipeProduct) {
      verticalHeight = this.showRecipeTable(subOrder, doc, verticalHeight);
      verticalHeight = this.showLaborCost(subOrder, doc, verticalHeight, horizontalDistance);
    }
    if (subOrder.orderNoteList.length > 0)
      verticalHeight = this.showOrderNoteTable(subOrder, doc, verticalHeight);

    this.useTrebucBoldFont(doc);
    const estimatedHeight = 20;
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginBottom = 10;

    if (verticalHeight + estimatedHeight + marginBottom > pageHeight) {
      doc.addPage();
      verticalHeight = 10;
    }

    this.useTrebucBoldFont(doc);

    const text = `${this.localizationService.instant('::OrderCopy:ScanOrder')} ${subOrder.subOrderNumber}`;
    const textWidth = doc.getTextWidth(text);
    const x = (pageWidth - textWidth) / 2;
    doc.text(text, x, verticalHeight);
    verticalHeight += 6;

    this.useTrebucFont(doc);

    this.generateBarcodeImage(doc, verticalHeight, false, subOrder.subOrderNumber);
    return doc;
  }

  private showOrderNoteTable(
    subOrder: SubOrderControlListDto,
    doc: jsPDF,
    verticalHeight: number,
  ): number {
    const marginBottom = 20;
    const pageHeight = doc.internal.pageSize.getHeight();

    const noteDetails = subOrder.orderNoteList.map(item => [
      formatDateTime(item.creationTime),
      item.userName,
      this.getEnumDisplayName(orderNoteTypeOptions, item.orderNoteType),
      item.note,
    ]);

    const tableHeightSimulator = (doc as any).autoTable({
      head: [
        [
          this.localizationService.instant('::Logs:CreationTime'),
          this.localizationService.instant('::EmployeeSettings'),
          this.localizationService.instant('::OrderCopy:ActionTaken'),
          this.localizationService.instant('::ValueTypes:Details'),
        ],
      ],
      body: noteDetails,
      startY: 0,
      styles: { fontSize: 10 },
      theme: 'plain',
      margin: { top: 0, bottom: 0 },
      didDrawCell: () => false,
      willDrawCell: () => false,
      showHead: 'everyPage',
      useCss: true,
      didDrawPage: () => false,
      pageBreak: 'avoid',
      tableLineWidth: 0,
      tableLineColor: 255,
      tableId: 'simulator',
    });

    const simulatedHeight = (tableHeightSimulator as any).lastAutoTable.finalY;

    // If the table height exceeds the available page height, add a new page first
    const spaceAvailable = pageHeight - verticalHeight - marginBottom;
    if (simulatedHeight > spaceAvailable) {
      doc.addPage();
      verticalHeight = 10;
    }

    autoTable(doc, {
      startY: verticalHeight,
      head: [
        [
          this.localizationService.instant('::Logs:CreationTime'),
          this.localizationService.instant('::EmployeeSettings'),
          this.localizationService.instant('::OrderCopy:ActionTaken'),
          this.localizationService.instant('::ValueTypes:Details'),
        ],
      ],
      body: noteDetails,
      styles: { fontSize: 10, textColor: 0 },
      theme: 'plain',
      margin: { left: 10, right: 6 },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 'auto' },
      },
    });

    return (doc as any).lastAutoTable.finalY + 10;
  }

  private showLaborCost(
    subOrder: SubOrderControlListDto,
    doc: jsPDF,
    verticalHeight: number,
    horizontalDistance: number,
  ): number {
    let totalRecipeProductsPrice = 0;

    subOrder.productRecipeDtoList.forEach(item => {
      totalRecipeProductsPrice += item.totalPrice;
    });

    let totalCost = totalRecipeProductsPrice + subOrder.laborCost;

    doc.text(
      `${this.localizationService.instant('::Product.LaborCost')}:   $${subOrder.laborCost}`,
      horizontalDistance,
      verticalHeight,
    );
    doc.text(
      `${this.localizationService.instant('::OrderCopy:Flower/Sup')}:   $${totalRecipeProductsPrice.toFixed(2)}`,
      horizontalDistance + 80,
      verticalHeight,
    );
    this.useTrebucBoldFont(doc);
    doc.text(
      `${this.localizationService.instant('::OrderCopy:BudgetedAmount')}:   $${totalCost.toFixed(2)}`,
      horizontalDistance + 150,
      verticalHeight,
    );

    verticalHeight += 4;
    let laborPct = (subOrder.laborCost * 100) / totalCost;
    let flowerPct = (totalRecipeProductsPrice * 100) / totalCost;

    this.useTrebucFont(doc);

    doc.text(
      `${this.localizationService.instant('::Reports:SalesmanGrossMarginAnalysis.Pct')}`,
      horizontalDistance,
      verticalHeight,
    );

    doc.text(laborPct.toFixed(2) + '%', horizontalDistance + 22, verticalHeight);
    doc.text(`${flowerPct.toFixed(2)}%`, horizontalDistance + 103, verticalHeight);
    doc.text(`100%`, horizontalDistance + 178, verticalHeight);

    return verticalHeight + 8;
  }

  private showRecipeTable(
    subOrder: SubOrderControlListDto,
    doc: jsPDF,
    verticalHeight: number,
  ): number {
    let recipeDetails = [];

    subOrder.productRecipeDtoList.forEach((item, index) => {
      let recipe = [];
      recipe.push(index + 1);
      recipe.push(item.productCode);
      recipe.push(item.description ?? '-');
      recipe.push(item.quantity);
      recipe.push(`$${item.basePrice.toFixed(2)}`);
      recipe.push(`$${item.totalPrice.toFixed(2)}`);
      recipeDetails.push(recipe);
    });

    autoTable(doc, {
      startY: verticalHeight,
      head: [
        [
          this.localizationService.instant('::OrderCopy:LineItem'),
          this.localizationService.instant('::Product.ProductCode'),
          this.localizationService.instant('::Reports:ProductRankingReport:ProductDescription'),
          this.localizationService.instant('::Reports:ProductSalesByOrderPlacement:Units'),
          this.localizationService.instant('::Reports:OrderReport:UnitPrice'),
          this.localizationService.instant('::Recipe.TotalPrice'),
        ],
      ],
      body: recipeDetails,
      styles: { fontSize: 10, textColor: 0 },
      theme: 'grid',
      margin: { left: 10, right: 6 },
      headStyles: { fillColor: [215, 204, 200], textColor: 0 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 20 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 20 },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 25, halign: 'right' },
      },
      didParseCell: data => {
        if ([4, 5].includes(data.column.index)) data.cell.styles.halign = 'right';
      },
    });

    verticalHeight = (doc as any).lastAutoTable.finalY + 10;

    return verticalHeight;
  }

  private showChargeDetails(
    subOrder: SubOrderControlListDto,
    doc: jsPDF,
    verticalHeight: number,
    horizontalDistance: number,
  ): number {
    const anchorX = horizontalDistance + 195;
    const lineGap = 5;

    doc.text(
      `${this.localizationService.instant('::OrderCopy:Mdse')}:`,
      horizontalDistance + 160,
      verticalHeight,
    );
    verticalHeight = this.drawAmountLine(doc, subOrder.totalUnitPrice, anchorX, verticalHeight);

    doc.text(
      `${this.localizationService.instant('::Customer:Discount')}:`,
      horizontalDistance + 160,
      verticalHeight + lineGap,
    );
    verticalHeight = this.drawAmountLine(
      doc,
      subOrder.itemDiscount,
      anchorX,
      verticalHeight + lineGap,
    );

    doc.text(
      `${this.localizationService.instant('::Pos:DeliveryFee')}:`,
      horizontalDistance + 160,
      verticalHeight + lineGap,
    );
    verticalHeight = this.drawAmountLine(
      doc,
      subOrder.itemDeliveryFee,
      anchorX,
      verticalHeight + lineGap,
    );

    doc.text(
      `${this.localizationService.instant('::Reports:StoreSalesAnalysis:Tax')}:`,
      horizontalDistance + 160,
      verticalHeight + lineGap,
    );
    verticalHeight = this.drawAmountLine(doc, subOrder.itemTax, anchorX, verticalHeight + lineGap);

    this.useTrebucBoldFont(doc);
    doc.text(
      `${this.localizationService.instant('::InvoicePrint:Total')}:`,
      horizontalDistance + 160,
      verticalHeight + lineGap,
    );

    let subtotal =
      subOrder.totalUnitPrice + subOrder.itemTax + subOrder.itemDeliveryFee - subOrder.itemDiscount;

    verticalHeight = this.drawAmountLine(doc, subtotal, anchorX, verticalHeight + lineGap);
    this.useTrebucFont(doc);

    return verticalHeight + lineGap;
  }

  private drawAmountLine(doc: jsPDF, value: number, anchorX: number, y: number) {
    const valueStr = value.toFixed(2);
    const [dollars, cents] = valueStr.split('.');
    const dollarText = `$${dollars}`;
    const centsText = `.${cents}`;
    const dollarWidth = doc.getTextWidth(dollarText);
    const centsWidth = doc.getTextWidth(centsText);

    const dollarX = anchorX - dollarWidth - centsWidth;
    const centsX = anchorX - centsWidth;

    doc.text(dollarText, dollarX - 2, y);
    doc.text(centsText, centsX - 2, y);

    return y;
  }

  private showProductTable(
    subOrder: SubOrderControlListDto,
    doc: jsPDF,
    verticalHeight: number,
  ): number {
    const productDetails = [
      [
        subOrder.productCode,
        subOrder.productDescription,
        subOrder.quantity,
        `$${subOrder.unitPrice.toFixed(2)}`,
        `$${subOrder.totalUnitPrice.toFixed(2)}`,
      ],
    ];

    autoTable(doc, {
      startY: verticalHeight,
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
      styles: { fontSize: 10, textColor: 0 },
      theme: 'grid',
      margin: { left: 10, right: 6 },
      headStyles: { fillColor: [215, 204, 200], textColor: 0 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 20 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
      },
      didParseCell: data => {
        if ([3, 4].includes(data.column.index)) data.cell.styles.halign = 'right';
      },
    });

    verticalHeight = (doc as any).lastAutoTable.finalY + 10;

    return verticalHeight;
  }

  private showCustomerDetails(
    subOrder: SubOrderControlListDto,
    doc: jsPDF,
    verticalHeight: number,
    horizontalDistance: number,
  ): number {
    verticalHeight += 4;

    let initialVerticalHeightRightContent = verticalHeight;

    doc.text(subOrder.customerName, horizontalDistance, verticalHeight);
    verticalHeight += 5;
    doc.text(subOrder.customerAddress1, horizontalDistance, verticalHeight);
    verticalHeight += 5;
    doc.text(
      `${subOrder.customerCity} ${subOrder.customerStateCode} ${subOrder.customerZipCode}`,
      horizontalDistance,
      verticalHeight,
    );
    verticalHeight += 5;
    doc.text(subOrder.customerPhoneNo ?? '-', horizontalDistance, verticalHeight);
    verticalHeight += 5;
    doc.text(subOrder.customerPrimaryEmail ?? '-', horizontalDistance, verticalHeight);
    verticalHeight += 5;

    doc.text(
      subOrder.recipientName ?? '-',
      horizontalDistance + 120,
      initialVerticalHeightRightContent,
    );
    initialVerticalHeightRightContent += 5;
    doc.text(
      subOrder.recipientAddress1 ?? '-',
      horizontalDistance + 120,
      initialVerticalHeightRightContent,
    );
    initialVerticalHeightRightContent += 5;
    doc.text(
      `${subOrder.recipientCity ?? '-'} ${subOrder.recipientStateCode ?? '-'} ${subOrder.recipientPostalCode ?? '-'}`,
      horizontalDistance + 120,
      initialVerticalHeightRightContent,
    );
    initialVerticalHeightRightContent += 5;
    doc.text(
      subOrder.recipientPhoneNo?.trim() ? subOrder.recipientPhoneNo : '-',
      horizontalDistance + 120,
      initialVerticalHeightRightContent,
    );
    initialVerticalHeightRightContent += 5;
    doc.text(
      subOrder.recipientEmail ?? '-',
      horizontalDistance + 120,
      initialVerticalHeightRightContent,
    );
    initialVerticalHeightRightContent += 5;

    return verticalHeight + 4;
  }

  private showCustomerBasicInfo(
    subOrder: SubOrderControlListDto,
    doc: jsPDF,
    verticalHeight: number,
    horizontalDistance: number,
  ): number {
    doc.setLineDashPattern([1, 1], 0);
    doc.setDrawColor(0);
    doc.line(6, verticalHeight, 200, verticalHeight);
    doc.setLineDashPattern([], 0);

    verticalHeight += 4;

    this.useTrebucBoldFont(doc);

    doc.text(
      `${this.localizationService.instant('::OrderCopy:HouseCharge')}:${subOrder.customerId ?? '-'}`,
      horizontalDistance,
      verticalHeight,
    );
    doc.text(
      this.getEnumDisplayName(orderTypeOptions, subOrder.orderType),
      horizontalDistance + 80,
      verticalHeight,
    );
    doc.text(
      `${this.localizationService.instant('::OrderCopy:Recipient')}`,
      horizontalDistance + 120,
      verticalHeight,
    );
    doc.text(
      `${this.localizationService.instant('::OrderCopy:Rep')}: ${subOrder.salesRepresentative}`,
      horizontalDistance + 160,
      verticalHeight,
    );

    verticalHeight += 4;

    doc.setLineDashPattern([1, 1], 0);
    doc.setDrawColor(0);
    doc.line(6, verticalHeight, 200, verticalHeight);
    doc.setLineDashPattern([], 0);

    verticalHeight += 4;
    this.useTrebucFont(doc);

    return verticalHeight;
  }

  private generateStoreDetails(
    subOrder: SubOrderControlListDto,
    doc: jsPDF,
    rightVerticalHeight: number,
    horizontalRightDistance: number,
  ): void {
    doc.setFontSize(9);
    doc.text(`Curr. Time: ${getCurrentTime()}`, horizontalRightDistance, rightVerticalHeight);
    rightVerticalHeight += 5;
    doc.text(subOrder.originalStoreName, horizontalRightDistance, rightVerticalHeight);
    rightVerticalHeight += 5;
    doc.text(subOrder.storeAddress1, horizontalRightDistance, rightVerticalHeight);
    rightVerticalHeight += 5;
    doc.text(
      `${subOrder.storeCity} ${subOrder.storeStateCode} ${subOrder.storeZipCode}`,
      horizontalRightDistance,
      rightVerticalHeight,
    );
    rightVerticalHeight += 5;
    doc.text(subOrder.storePhoneNumber, horizontalRightDistance, rightVerticalHeight);
  }

  private getEnumDisplayName(enumOptions: any[], enumValue: number): string {
    const option = enumOptions.find(option => option.value === enumValue);
    return option ? option.key : '-';
  }

  private generateOrderDeliveryDetailsTime(
    subOrder: SubOrderControlListDto,
    doc: jsPDF,
    verticalHeight: number,
    horizontalDistance: number,
  ): number {
    doc.setFontSize(12);
    this.useTrebucBoldFont(doc);
    doc.text(`${subOrder.subOrderNumber}`, horizontalDistance, verticalHeight);
    verticalHeight += 6;
    const [line1, line2] = this.getFormattedDeliveryDates(subOrder.deliveryDate);
    let time = subOrder.deliveryDate ? line1 : '-';
    let date = subOrder.deliveryDate ? line2 : '-';
    let label = subOrder.deliveryDate
      ? this.localizationService.instant('::Enum:RecipientDeliveryType.1')
      : '-';

    doc.text(time, horizontalDistance, verticalHeight);
    verticalHeight += 6;
    doc.text(label, horizontalDistance, verticalHeight);
    verticalHeight += 6;
    doc.text(date, horizontalDistance, verticalHeight);
    verticalHeight += 6;

    return verticalHeight;
  }

  private getFormattedDeliveryDates(deliveryDate: string): string[] {
    const dateObj = new Date(deliveryDate);
    let hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const isPM = hours >= 12;
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    const formattedTime = `BY ${displayHours}.${minutes.toString().padStart(2, '0')}${isPM ? ' PM' : ' AM'}`;

    const formattedDate = dateObj.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const dateLine = `${formattedDate} ${dayName}`;
    return [formattedTime, dateLine];
  }

  private generateBarcodeImage(
    doc: jsPDF,
    verticalHeight: number,
    isTop: boolean,
    subOrderNumber: number,
  ): void {
    const barcodeNumber = `${isTop ? '#' : '*'}${subOrderNumber}`;
    const barcodeImage = this.barCodeService.generateBarcodeBase64(barcodeNumber);

    const pageWidth = doc.internal.pageSize.getWidth();
    const imageWidth = 60;
    const imageHeight = 15;
    const x = (pageWidth - imageWidth) / 2;
    doc.addImage(barcodeImage, 'PNG', x, verticalHeight, imageWidth, imageHeight);
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
