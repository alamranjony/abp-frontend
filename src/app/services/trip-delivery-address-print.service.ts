import { LocalizationService } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import {
  TripDeliveryInfoPrintDto,
  DeliveryAddressPrintDto,
  TripProductDetailsDto,
} from '@proxy/trips';
import jsPDF from 'jspdf';
import moment from 'moment';
import { HELIVETICA_FONT_NAME } from '../shared/constants';

@Injectable({
  providedIn: 'root',
})
export class TripDeliveryAddressPrintService {
  currentTimeText: string;
  etaText: string;
  assignedToText: string;
  deliveryForText: string;
  itemsText: string;
  phoneText: string;
  codMessageText: string;
  codOfText: string;
  filledText: string;
  codeText: string;
  timeText: string;
  printNameText: string;

  constructor(private readonly localizationService: LocalizationService) {}

  generatePdf(tripDeliveryInfo: TripDeliveryInfoPrintDto) {
    this.getLocalizedText();
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const cardWidth = pageWidth - margin * 2;
    const pageHeightAfterMargin = pageHeight - margin * 2;
    const defaultCardHeight = 37;
    const lineHeight = 7;
    const codTextHeight = 10;
    const formTextHeight = 20;
    const heightOfEachProductNameText = 6;
    const initialY = margin;
    let y = initialY;

    this.printHeader(doc, cardWidth, y, tripDeliveryInfo);
    y += lineHeight + 3;

    tripDeliveryInfo.deliveryAddresses.forEach((deliveryDetails, index) => {
      const currentCardStartY = y;
      const currentCardHeight =
        defaultCardHeight + deliveryDetails.tripProductDetails.length * heightOfEachProductNameText;

      this.drawDeliveryDetailsCard(
        doc,
        deliveryDetails,
        margin,
        y,
        cardWidth,
        currentCardHeight,
        lineHeight,
        heightOfEachProductNameText,
      );

      y = currentCardStartY + currentCardHeight;

      if (deliveryDetails.isCODOrder) {
        this.drawCodSection(doc, deliveryDetails, margin, y, cardWidth);
        y += codTextHeight;
      }

      this.drawFormSection(doc, margin, y);
      y += formTextHeight + 10;

      const nextDeliveryDetails = deliveryDetails[index + 1];
      const nextCardHeight =
        defaultCardHeight +
        (nextDeliveryDetails?.tripProductDetails.length || 0) * heightOfEachProductNameText;
      const nextHeight = nextCardHeight + codTextHeight + formTextHeight;

      if (y + nextHeight > pageHeightAfterMargin) {
        doc.addPage();
        y = initialY;
      }
    });

    return doc;
  }

  private printHeader(
    doc: jsPDF,
    cardWidth: number,
    y: number,
    tripDeliveryInfo: TripDeliveryInfoPrintDto,
  ): void {
    this.setFontInNormal(doc, 9);

    const currentTime = moment().format('MM/DD/YYYY hh:mm a');
    const eta = tripDeliveryInfo.eta;
    const tripId = tripDeliveryInfo.tripId;
    const employeeName = tripDeliveryInfo.driverName;
    const deliveryDate = moment().format('MM/DD/YYYY ddd');

    doc.text(
      `${this.currentTimeText}: ${currentTime}      ${this.etaText}: ${eta}`,
      cardWidth / 2,
      y,
      {
        align: 'center',
      },
    );

    this.setFontInBold(doc, 12);

    doc.text(
      `${this.assignedToText}: ${tripId} ${employeeName}           ${this.deliveryForText}: ${deliveryDate}\n`,
      cardWidth / 2,
      y + 7,
      { align: 'center' },
    );
  }

  private drawDeliveryDetailsCard(
    doc: jsPDF,
    deliveryDetails: DeliveryAddressPrintDto,
    x: number,
    y: number,
    cardWidth: number,
    cardHeight: number,
    lineHeight: number,
    heightOfEachProductNameText: number,
  ): void {
    const xPadding = 2;
    const yPadding = 7;
    const tripPinWidth = 13;
    const orderNoWidth = 15;
    const occassionTypeWidth = 35;
    const timeFieldWidth = 20;
    const itemCountWidth = 25;

    const tripPinStartX = x;
    const orderNoStartX = tripPinStartX + tripPinWidth;
    const deliveryInstructionStartX =
      orderNoStartX + orderNoWidth + occassionTypeWidth + timeFieldWidth;
    const itemCountStartX = x + cardWidth - itemCountWidth;
    const recipientNameStartX = orderNoStartX;
    const locationType = this.localizationService
      .instant(`::Enum:LocationType.${deliveryDetails.locationType}`)
      .toUpperCase();

    doc.rect(x, y, cardWidth, cardHeight);

    this.setFontInBold(doc);

    doc.text(`${deliveryDetails.tripPin}   `, tripPinStartX + xPadding, y + yPadding);
    doc.text(
      `${deliveryDetails.subOrderNumber}  ${locationType}     ${deliveryDetails.timeRequirement}`,
      orderNoStartX,
      y + yPadding,
    );

    doc.text(
      `${deliveryDetails.deliveryInstruction}`,
      deliveryInstructionStartX + xPadding,
      y + yPadding,
    );
    doc.text(
      `${deliveryDetails.tripProductDetails.length} ${this.itemsText}`,
      itemCountStartX - xPadding,
      y + 14,
    );
    doc.text(`${deliveryDetails.zoneCode}`, itemCountStartX - xPadding, y + 20);

    doc.text(`${deliveryDetails.slotName}`, itemCountStartX - xPadding, y + 26);
    const slotNameWidth = doc.getTextWidth(deliveryDetails.slotName);
    doc.line(
      itemCountStartX - xPadding,
      y + 27,
      itemCountStartX - xPadding + slotNameWidth,
      y + 27,
    );

    let textY = y + lineHeight * 2;

    this.setFontInNormal(doc);

    doc.text(`${deliveryDetails.recipientName}`, recipientNameStartX, textY);
    textY += lineHeight;
    doc.text(
      `${deliveryDetails.address1}, ${deliveryDetails.city}, ${deliveryDetails.state}, ${deliveryDetails.zipCode}`,
      recipientNameStartX,
      textY,
    );
    textY += lineHeight;

    doc.text(`${this.phoneText}: ${deliveryDetails.phone}`, recipientNameStartX, textY);
    textY += lineHeight;
    this.setFontInNormal(doc, 9);

    deliveryDetails.tripProductDetails.forEach((tripProduct: TripProductDetailsDto) => {
      doc.text(
        `${tripProduct.quantity}   ${tripProduct.productName} - ${tripProduct.productDescription}\n`,
        recipientNameStartX - 5,
        textY,
      );
      textY += heightOfEachProductNameText;
    });
  }

  private drawCodSection(
    doc: jsPDF,
    deliveryDetails: DeliveryAddressPrintDto,
    x: number,
    y: number,
    cardWidth: number,
  ): void {
    const xPadding = 4;

    this.setFontInBold(doc);

    doc.text(`${this.codMessageText}`, x + xPadding, y + 7, { align: 'left' });
    doc.text(
      `${this.codOfText}: $${deliveryDetails.totalAmount}`,
      cardWidth + x - xPadding,
      y + 7,
      {
        align: 'right',
      },
    );

    this.setFontInNormal(doc);
  }

  private drawFormSection(doc: jsPDF, x: number, y: number): void {
    doc.text(
      `______________${this.filledText}______________ ${this.codeText}:_____________ ${this.timeText}:_____________ ${this.printNameText}:_________________`,
      x,
      y + 10,
    );
  }

  private setFontInNormal(doc: jsPDF, fontSize?: number): void {
    this.setFontConfig(doc, fontSize || 10, 'normal');
  }

  private setFontInBold(doc: jsPDF, fontSize?: number): void {
    this.setFontConfig(doc, fontSize || 10, 'bold');
  }

  private setFontConfig(doc: jsPDF, fontSize: number, fontType: 'normal' | 'bold'): void {
    doc.setFont(HELIVETICA_FONT_NAME, fontType);
    doc.setFontSize(fontSize);
  }

  private getLocalizedText() {
    this.currentTimeText = this.localizationService.instant('::DeliveryTripPrint:CurrentTime');
    this.etaText = this.localizationService.instant('::DeliveryTripPrint:ETA');
    this.assignedToText = this.localizationService.instant('::DeliveryTripPrint:AssignedTo');
    this.deliveryForText = this.localizationService.instant('::DeliveryTripPrint:DeliveryFor');

    this.itemsText = this.localizationService.instant('::DeliveryTripPrint:Items');
    this.phoneText = this.localizationService.instant('::DeliveryTripPrint:Phone');

    this.codMessageText = this.localizationService.instant('::DeliveryTripPrint:CODPleaseCollect');
    this.codOfText = this.localizationService.instant('::DeliveryTripPrint:CODOf');

    this.filledText = this.localizationService.instant('::DeliveryTripPrint:Filled');
    this.codeText = this.localizationService.instant('::DeliveryTripPrint:Code');
    this.timeText = this.localizationService.instant('::DeliveryTripPrint:Time');
    this.printNameText = this.localizationService.instant('::DeliveryTripPrint:PrintName');
  }
}
