import { Injectable, OnDestroy } from '@angular/core';
import { LocalizationService, PagedResultDto } from '@abp/ng.core';
import {
  GiftCardDto,
  GiftCardService,
  giftCardTypeOptions,
  giftCardStatusOptions,
} from '@proxy/gift-cards';
import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';
import { forkJoin, Observable, Subject, takeUntil } from 'rxjs';
import {
  MAX_RESULT_COUNT,
  REPORT_FONT_FILE_NAME,
  REPORT_FONT_NAME,
  REPORT_FONT_TYPE,
  REPORT_HEADER_BACKGROUND_COLOR,
  REPORT_HEADER_TEXT_COLOR,
  ROUNDING_PRECISION,
} from '../shared/constants';
import { HttpClient } from '@angular/common/http';
import { ToasterService } from '@abp/ng.theme.shared';
import {
  FilterPagedAndSortedOrderControlListResultRequestDto,
  OrderService,
  orderStatusOptions,
  OrderType,
  orderTypeOptions,
  SubOrderControlListDto,
} from '@proxy/orders';
import trebucFont from 'src/assets/fonts/trebuc-normal.js';
import {
  FilterDateCategory,
  filterDateTypeForCancelOptions,
  OrderReportService,
} from '@proxy/reports';
import { formatFilterItem } from './reports/reports-utils';
import { ReportFilterDto } from '../models/report-filter-dto';

@Injectable({
  providedIn: 'root',
})
export class PdfGeneratorService implements OnDestroy {
  private readonly logoUrl = 'assets/images/logo/ffc-logo.jpg';
  destroy$: Subject<void> = new Subject();

  filters: ReportFilterDto;

  constructor(
    private giftCardService: GiftCardService,
    private http: HttpClient,
    private toasterService: ToasterService,
    private orderService: OrderService,
    private localizationService: LocalizationService,
    private orderReportService: OrderReportService,
  ) {}

  private getEnumDisplayName(enumOptions: any[], enumValue: number): string {
    const unknownText = this.localizationService.instant('::Reports:Common:Unknown');
    const option = enumOptions.find(option => option.value === enumValue);
    return option ? option.key : unknownText;
  }

  generateGiftCardsPdf(): void {
    const allGiftCards: GiftCardDto[] = [];
    let skipCount = 0;
    const maxResultCount = MAX_RESULT_COUNT;

    const fetchBatch = () => {
      this.fetchGiftCards(skipCount, maxResultCount).subscribe(response => {
        allGiftCards.push(...response.items);
        if (response.totalCount > skipCount + maxResultCount) {
          skipCount += maxResultCount;
          fetchBatch();
        } else {
          if (allGiftCards.length === 0) {
            this.toasterService.warn('No gift card to export');
            return;
          }
          this.loadLogoAndGeneratePdf(allGiftCards);
        }
      });
    };
    fetchBatch();
  }

  fetchGiftCards(
    skipCount: number,
    maxResultCount: number,
  ): Observable<PagedResultDto<GiftCardDto>> {
    return this.giftCardService.getList({
      skipCount: skipCount,
      maxResultCount: maxResultCount,
    });
  }

  generateOrderReport(
    input: FilterPagedAndSortedOrderControlListResultRequestDto,
    productTypes: string[],
    productDepartments: string[],
    stores: string[],
  ) {
    forkJoin([
      this.orderService.generateOrderReport(input),
      this.http.get(this.logoUrl, { responseType: 'blob' }),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([orders, logoBlob]) => {
        if (!orders || orders.length === 0) {
          this.toasterService.warn('::OrderReport:NotFound');
          return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(logoBlob);
        reader.onloadend = () => {
          const logoBase64 = reader.result as string;
          this.generateOrderReportPdf(
            orders,
            logoBase64,
            input,
            productTypes,
            productDepartments,
            stores,
          );
        };
      });
  }

  generateCreditAndReplacementOrderReport(
    input: FilterPagedAndSortedOrderControlListResultRequestDto,
    filters: ReportFilterDto,
  ) {
    this.filters = filters;

    forkJoin([
      this.orderReportService.generateCreditAndReplacementOrdersReport(input),
      this.http.get(this.logoUrl, { responseType: 'blob' }),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([orders, logoBlob]) => {
        if (!orders || orders.length === 0) {
          this.toasterService.warn('::OrderReport:NotFound');
          return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(logoBlob);
        reader.onloadend = () => {
          const logoBase64 = reader.result as string;
          this.generateCreditAndReplacementOrderReportPdf(orders, logoBase64);
        };
      });
  }

  private getCreditAndReplacementOrderReportBody(orders: SubOrderControlListDto[]) {
    return orders.map(order => [
      order.salesRepresentative,
      order.orderNumber,
      this.getEnumDisplayName(orderTypeOptions, order.orderType),
      order.orderDate ? new Date(order.orderDate).toLocaleDateString() : '',
      order.deliveredDate ? new Date(order.deliveredDate).toLocaleDateString() : '',
      order.productCode,
      order.quantity,
      order.productDescription,
      `$${order.unitPrice}`,
      `$${order.quantity * order.unitPrice}`,
      order.cancelReasonDescription,
    ]);
  }

  private getCreditAndReplacementOrderSummaryReportBody(orders: SubOrderControlListDto[]) {
    const groupedOrders = this.groupOrdersByReasonCode(orders);

    const body: (string | number)[][] = [];
    let totalCredits = 0;
    let totalReplacements = 0;
    let totalCreditAmount = 0;
    let totalReplacementAmount = 0;

    Object.keys(groupedOrders).forEach(reasonCode => {
      const group = groupedOrders[reasonCode];
      const reasonDesc = group[0]?.cancelReasonDescription || '';

      let creditCount = 0;
      let replacementCount = 0;
      let creditAmount = 0;
      let replacementAmount = 0;

      group.forEach(order => {
        if (order.orderType === OrderType.IVCR) {
          creditCount++;
          creditAmount += order.quantity * order.unitPrice;
        } else if (order.orderType === OrderType.RP) {
          replacementCount++;
          replacementAmount += order.quantity * order.unitPrice;
        }
      });

      totalCredits += creditCount;
      totalReplacements += replacementCount;
      totalCreditAmount += creditAmount;
      totalReplacementAmount += replacementAmount;

      body.push([
        reasonDesc,
        creditCount,
        `$${creditAmount.toFixed(ROUNDING_PRECISION)}`,
        replacementCount,
        `$${replacementAmount.toFixed(ROUNDING_PRECISION)}`,
      ]);
    });

    const subTotalColName = this.localizationService.instant(
      '::Reports:CreditReplacementOrderReport:SubTotal',
    );
    body.push([
      subTotalColName,
      totalCredits,
      `$${totalCreditAmount.toFixed(ROUNDING_PRECISION)}`,
      totalReplacements,
      `$${totalReplacementAmount.toFixed(ROUNDING_PRECISION)}`,
    ]);

    return body;
  }

  private generateCreditAndReplacementOrderReportPdf(
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

    const detailsReportBody = this.getCreditAndReplacementOrderReportBody(orders);
    this.addCreditAndReplacementOrderDetailsReport(doc, detailsReportBody, logoBase64, currentTime);

    doc.addPage();

    const summaryReportBody = this.getCreditAndReplacementOrderSummaryReportBody(orders);

    this.addCreditAndReplacementOrderSummaryReport(doc, summaryReportBody, logoBase64, currentTime);

    const fileName = this.localizationService.instant(
      '::Reports:CreditAndReplacementOrderReport:DownloadableFileName',
    );
    doc.save(fileName);
  }

  private addCreditAndReplacementOrderDetailsReport(
    doc: jsPDF,
    body: (string | number)[][],
    logoBase64: string,
    currentTime: string,
  ) {
    const employee = this.localizationService.instant('::Reports:CancelledOrderReport:employee');
    const orderType = this.localizationService.instant('::Reports:CancelledOrderReport:OrderType');
    const reasonCode = this.localizationService.instant(
      '::Reports:CancelledOrderReport:reasonCode',
    );
    const orderDate = this.localizationService.instant('::Reports:CancelledOrderReport:orderDate');
    const orderNo = this.localizationService.instant('::Reports:CancelledOrderReport:orderNo');
    const deliveryDate = this.localizationService.instant(
      '::Reports:CancelledOrderReport:DeliveryDate',
    );
    const productCode = this.localizationService.instant('::Reports:OrderReport:ProdCode');
    const quantity = this.localizationService.instant('::Reports:OrderReport:Qty');
    const productDescription = this.localizationService.instant(
      '::Reports:OrderReport:ProductDescription',
    );
    const unitPrice = this.localizationService.instant('::Reports:OrderReport:UnitPrice');
    const extPrice = this.localizationService.instant('::Reports:OrderReport:ExtPrice');
    const detailsReportName = this.localizationService.instant(
      '::Reports:CreditAndReplacementOrderReport:DetailsReportName',
    );

    autoTable(doc, {
      startY: 85,
      head: [
        [
          employee,
          orderNo,
          orderType,
          orderDate,
          deliveryDate,
          productCode,
          quantity,
          productDescription,
          unitPrice,
          extPrice,
          reasonCode,
        ],
      ],
      body: body,
      didDrawPage: data => {
        this.addPageHeader(doc, logoBase64, currentTime, data.pageNumber, detailsReportName);

        const filterBody = this.getCreditAndReplacementOrderFilterTableBody();

        this.addFilterTable(doc, filterBody);
      },
      margin: { top: 85 },
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

  private addCreditAndReplacementOrderSummaryReport(
    doc: jsPDF,
    groupedBody: RowInput[],
    logoBase64: string,
    currentTime: string,
  ) {
    const lastPageCount = doc.getNumberOfPages() - 1;

    const reasonCode = this.localizationService.instant(
      '::Reports:CancelledOrderReport:reasonCode',
    );
    const credits = this.localizationService.instant('::Reports:CancelledOrderReport:Credits');
    const replacement = this.localizationService.instant(
      '::Reports:CancelledOrderReport:Replacement',
    );
    const orders = this.localizationService.instant('::Reports:CancelledOrderReport:Orders');
    const dollarAmt = this.localizationService.instant('::Reports:CancelledOrderReport:DollarAmt');
    const summaryReportName = this.localizationService.instant(
      '::Reports:CreditAndReplacementOrderReport:SummaryReportName',
    );

    autoTable(doc, {
      startY: 85,
      head: [
        [
          { content: '', colSpan: 1 },
          { content: credits, colSpan: 2 },
          { content: replacement, colSpan: 2 },
        ],
        [reasonCode, orders, dollarAmt, orders, dollarAmt],
      ],
      body: groupedBody,
      didDrawPage: data => {
        this.addPageHeader(
          doc,
          logoBase64,
          currentTime,
          data.pageNumber + lastPageCount,
          summaryReportName,
        );

        const filterBody = this.getCreditAndReplacementOrderFilterTableBody();
        this.addFilterTable(doc, filterBody);
      },
      margin: { top: 80 },
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

  private getCreditAndReplacementOrderFilterTableBody(): string[][] {
    const {
      filterDateCategory,
      fromDate,
      toDate,
      storeNames,
      orderTypeNames,
      productDepartmentNames,
      productNames,
      cancellationReasonNames,
      replacementReasonNames,
    } = this.filters;

    const allSelectionText = this.localizationService.instant(
      '::Reports:OrderReport:Filter:AllSelect',
    );
    const orderTypeFilter = this.localizationService.instant(
      '::Reports:StoreSalesAnalysis:OrderType',
    );
    const deliveryDateText = this.localizationService.instant('::Reports:Common:DeliveryDate');
    const orderDateText = this.localizationService.instant('::Reports:Common:OrderDate');
    const storesFilter = this.localizationService.instant('::Reports:OrderReport:Filter:Stores');

    const fromDateValue = fromDate ? new Date(fromDate).toLocaleDateString() : '';
    const toDateValue = toDate ? new Date(toDate).toLocaleDateString() : '';
    const dateFilter = `${fromDateValue} To ${toDateValue}`;
    const orderTypeList = formatFilterItem(orderTypeNames, allSelectionText);
    const productDepartments = formatFilterItem(productDepartmentNames, allSelectionText);
    const storeLocation = formatFilterItem(storeNames, allSelectionText);
    const productList = formatFilterItem(productNames, allSelectionText);
    const cancelReasons = formatFilterItem(cancellationReasonNames, allSelectionText);
    const replacementReasons = formatFilterItem(replacementReasonNames, allSelectionText);

    const productDepartment = this.localizationService.instant(
      '::Reports:OrderReport:Filter:ProductDepartment',
    );
    const cancelReason = this.localizationService.instant(
      '::Reports:OrderReport:Filter:CancelReason',
    );
    const replacementReason = this.localizationService.instant(
      '::Reports:OrderReport:Filter:ReplacementReason',
    );
    const products = this.localizationService.instant('::Reports:OrderReport:Filter:Products');

    return [
      [
        `${filterDateCategory === FilterDateCategory.OrderDate ? orderDateText : deliveryDateText}`,
        dateFilter,
        storesFilter,
        storeLocation,
      ],
      [productDepartment, productDepartments, products, productList],
      [replacementReason, replacementReasons, cancelReason, cancelReasons],
      [`${orderTypeFilter}: `, orderTypeList],
    ];
  }

  private loadLogoAndGeneratePdf(giftCards: GiftCardDto[]): void {
    this.http.get(this.logoUrl, { responseType: 'blob' }).subscribe(logoBlob => {
      const reader = new FileReader();
      reader.readAsDataURL(logoBlob);
      reader.onloadend = () => {
        const logoBase64 = reader.result as string;
        this.generatePdf(giftCards, logoBase64);
      };
    });
  }

  private generatePdf(giftCards: GiftCardDto[], logoBase64: string): void {
    const doc = new jsPDF();

    const logoWidth = 50;
    const logoHeight = 20;
    doc.addImage(logoBase64, 'jpg', 80, 10, logoWidth, logoHeight);

    doc.setFontSize(18);
    doc.text('Gift Card Report', 105, 40, { align: 'center' });

    const body = giftCards.map(giftCard => [
      giftCard.cardNumber,
      giftCard.reason || '',
      giftCard.customerName || '',
      giftCard.startingAmount?.toString() || '',
      giftCard.expirationDate ? new Date(giftCard.expirationDate).toLocaleDateString() : '',
      giftCard.balance?.toString() || '',
      this.getEnumDisplayName(giftCardTypeOptions, giftCard.giftCardType),
      this.getEnumDisplayName(giftCardStatusOptions, giftCard.giftCardStatus),
    ]);

    autoTable(doc, {
      startY: 50,
      head: [
        [
          'Gift Card Number',
          'Reason',
          'Customer Name',
          'Starting Amount',
          'Expiration Date',
          'Balance($)',
          'Gift Card Type',
          'Status',
        ],
      ],
      body: body,
    });
    doc.save('gift_cards.pdf');
  }

  private generateOrderReportPdf(
    orders: SubOrderControlListDto[],
    logoBase64: string,
    input: FilterPagedAndSortedOrderControlListResultRequestDto,
    productTypes: string[],
    productDepartments: string[],
    stores: string[],
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

    const detailsReportBody = this.getOrderDetailsReportBody(orders);
    const totalExtPriceDetail = orders.reduce((total, order) => total + order.extendedPrice, 0);
    this.addOrderDetailsReport(
      doc,
      detailsReportBody,
      logoBase64,
      currentTime,
      input,
      productTypes,
      productDepartments,
      stores,
      totalExtPriceDetail,
    );
    doc.addPage();
    const summaryReportBody = this.getOrderSummaryReportBody(orders);

    this.addOrderSummaryReport(
      doc,
      summaryReportBody,
      logoBase64,
      currentTime,
      input,
      productTypes,
      productDepartments,
      stores,
      totalExtPriceDetail,
    );

    const fileName = this.localizationService.instant('::Reports:OrderReport:DownloadableFileName');
    doc.save(fileName);
  }

  private addOrderDetailsReport(
    doc: jsPDF,
    body: (string | number)[][],
    logoBase64: string,
    currentTime: string,
    input: FilterPagedAndSortedOrderControlListResultRequestDto,
    productTypes: string[],
    productDepartments: string[],
    stores: string[],
    totalExtPriceDetail: number,
  ) {
    const salesRep = this.localizationService.instant('::Reports:OrderReport:SalesRep');
    const orderDate = this.localizationService.instant('::Reports:OrderReport:OrderDate');
    const type = this.localizationService.instant('::Reports:OrderReport:Type');
    const orderNo = this.localizationService.instant('::Reports:OrderReport:OrderNo');
    const deliveryDate = this.localizationService.instant('::Reports:OrderReport:DeliveryDate');
    const productCode = this.localizationService.instant('::Reports:OrderReport:ProdCode');
    const quantity = this.localizationService.instant('::Reports:OrderReport:Qty');
    const productDescription = this.localizationService.instant(
      '::Reports:OrderReport:ProductDescription',
    );
    const unitPrice = this.localizationService.instant('::Reports:OrderReport:UnitPrice');
    const extPrice = this.localizationService.instant('::Reports:OrderReport:ExtPrice');
    const detailsReportName = this.localizationService.instant(
      '::Reports:OrderReport:DetailsReportName',
    );

    autoTable(doc, {
      startY: 80,
      head: [
        [
          salesRep,
          orderDate,
          type,
          orderNo,
          deliveryDate,
          productCode,
          quantity,
          productDescription,
          unitPrice,
          extPrice,
        ],
      ],
      body: body,
      didDrawPage: data => {
        this.addPageHeader(doc, logoBase64, currentTime, data.pageNumber, detailsReportName);

        const filterBody = this.getFilterTableBody(input, productTypes, productDepartments, stores);

        this.addFilterTable(doc, filterBody);
      },
      margin: { top: 80 },
      headStyles: {
        halign: 'center',
        font: REPORT_FONT_NAME,
        fontStyle: REPORT_FONT_TYPE,
        fillColor: REPORT_HEADER_BACKGROUND_COLOR,
        textColor: REPORT_HEADER_TEXT_COLOR,
      },
      bodyStyles: { halign: 'center', font: REPORT_FONT_NAME, fontStyle: REPORT_FONT_TYPE },
    });

    this.addTotalExtPriceRow(doc, totalExtPriceDetail);
  }

  private addOrderSummaryReport(
    doc: jsPDF,
    groupedBody: any[],
    logoBase64: string,
    currentTime: string,
    input: FilterPagedAndSortedOrderControlListResultRequestDto,
    productTypes: string[],
    productDepartments: string[],
    stores: string[],
    totalExtPriceDetail: number,
  ) {
    const lastPageCount = doc.getNumberOfPages() - 1;

    const productCode = this.localizationService.instant('::Reports:OrderReport:ProdCode');
    const quantity = this.localizationService.instant('::Reports:OrderReport:Qty');
    const productDescription = this.localizationService.instant(
      '::Reports:OrderReport:ProductDescription',
    );
    const unitPrice = this.localizationService.instant('::Reports:OrderReport:UnitPrice');
    const extPrice = this.localizationService.instant('::Reports:OrderReport:ExtPrice');
    const summaryReportName = this.localizationService.instant(
      '::Reports:OrderReport:SummaryReportName',
    );

    autoTable(doc, {
      startY: 80,
      head: [[productCode, productDescription, unitPrice, extPrice, quantity]],
      body: groupedBody,
      didDrawPage: data => {
        this.addPageHeader(
          doc,
          logoBase64,
          currentTime,
          data.pageNumber + lastPageCount,
          summaryReportName,
        );

        const filterBody = this.getFilterTableBody(input, productTypes, productDepartments, stores);
        this.addFilterTable(doc, filterBody);
      },
      margin: { top: 80 },
      headStyles: {
        halign: 'center',
        font: REPORT_FONT_NAME,
        fontStyle: REPORT_FONT_TYPE,
        fillColor: REPORT_HEADER_BACKGROUND_COLOR,
        textColor: REPORT_HEADER_TEXT_COLOR,
      },
      bodyStyles: { halign: 'center', font: REPORT_FONT_NAME, fontStyle: REPORT_FONT_TYPE },
    });
    this.addTotalExtPriceRow(doc, totalExtPriceDetail);
  }

  private addTotalExtPriceRow(doc, totalExtPrice): void {
    const columnName = this.localizationService.instant('::Reports:OrderReport:TotalExtPrice');
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      body: [['', '', '', '', '', '', '', '', columnName, `$${totalExtPrice.toFixed(2)}`]],
      theme: 'plain',
      styles: { fontSize: 12, cellPadding: 4 },
      columnStyles: { 8: { halign: 'right', fontStyle: 'bold' } },
    });
  }

  private addLogo(doc: jsPDF, logoBase64: string, headerTitle: string): void {
    doc.addImage(logoBase64, 'jpg', 123, 10, 50, 20);
    doc.setFontSize(18);
    doc.text(headerTitle, 148.5, 40, { align: 'center' });
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

  private getOrderDetailsReportBody(orders: SubOrderControlListDto[]) {
    return orders.map(order => [
      order.salesRepresentative,
      order.orderDate ? new Date(order.orderDate).toLocaleDateString() : '',
      this.getEnumDisplayName(orderTypeOptions, order.orderType),
      order.orderNumber,
      order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : '',
      order.productCode,
      order.quantity,
      order.productDescription ?? '',
      `$${order.unitPrice}`,
      `$${order.extendedPrice}`,
    ]);
  }

  private getOrderSummaryReportBody(orders: SubOrderControlListDto[]) {
    const groupedOrders = this.groupOrdersByProductCode(orders);

    const body: any[] = [];

    Object.keys(groupedOrders).forEach(productCode => {
      const group = groupedOrders[productCode];

      group.forEach(order => {
        body.push([
          order.productCode,
          order.productDescription || '',
          `$${order.unitPrice}`,
          `$${order.extendedPrice}`,
          order.quantity,
        ]);
      });

      const subTotal = group.reduce((total, order) => total + order.extendedPrice, 0);
      const totalQuantity = group.reduce((total, order) => total + order.quantity, 0);

      const subTotalColName = this.localizationService.instant('::Reports:OrderReport:SubTotal');
      body.push([subTotalColName, '', '', `$${subTotal.toFixed(2)}`, totalQuantity]);
    });

    return body;
  }

  private groupOrdersByProductCode(orders: SubOrderControlListDto[]): {
    [key: string]: SubOrderControlListDto[];
  } {
    return orders.reduce(
      (groupedOrders, order) => {
        const productCode = order.productCode;
        groupedOrders[productCode] = groupedOrders[productCode] || [];
        groupedOrders[productCode].push(order);
        return groupedOrders;
      },
      {} as { [key: string]: SubOrderControlListDto[] },
    );
  }

  private getFilterTableBody(
    input: FilterPagedAndSortedOrderControlListResultRequestDto,
    productTypes: string[],
    productDepartments: string[],
    stores: string[],
  ): any[][] {
    const allSelectionText = this.localizationService.instant(
      '::Reports:OrderReport:Filter:AllSelect',
    );
    const fromDate = input.fromDate ? new Date(input.fromDate).toLocaleDateString() : '';
    const toDate = input.toDate ? new Date(input.toDate).toLocaleDateString() : '';
    const filterDateRange = this.localizationService.instant('::Reports:Common:DateRange');
    const dateRangeText = filterDateRange.replace('{0}', fromDate).replace('{1}', toDate);
    const selectedDateInfo = fromDate && toDate ? dateRangeText : '';
    const orderStatus = input.orderStatus
      ? this.getEnumDisplayName(orderStatusOptions, input.orderStatus)
      : allSelectionText;
    const productTypeNames = formatFilterItem(productTypes, allSelectionText);
    const productDepartmentNames = formatFilterItem(productDepartments, allSelectionText);
    const storeNames = formatFilterItem(stores, allSelectionText);

    const dateFilter = this.localizationService.instant('::Reports:OrderReport:Filter:Date');
    const orderStatusFilter = this.localizationService.instant(
      '::Reports:OrderReport:Filter:OrderStatus',
    );
    const productTypeFilter = this.localizationService.instant(
      '::Reports:OrderReport:Filter:ProductType',
    );
    const productDeptFilter = this.localizationService.instant(
      '::Reports:OrderReport:Filter:ProductDepartment',
    );
    const keywordFilter = this.localizationService.instant('::Reports:OrderReport:Filter:Keyword');
    const storesFilter = this.localizationService.instant('::Reports:OrderReport:Filter:Stores');

    return [
      [dateFilter, selectedDateInfo, orderStatusFilter, orderStatus],
      [productTypeFilter, productTypeNames, productDeptFilter, productDepartmentNames],
      [keywordFilter, input.keyword, storesFilter, storeNames],
    ];
  }

  private addFilterTable(doc: jsPDF, filterBody: any[][]): void {
    autoTable(doc, {
      body: filterBody,
      startY: 50,
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 2,
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

  private groupOrdersByReasonCode(orders: SubOrderControlListDto[]): {
    [key: string]: SubOrderControlListDto[];
  } {
    return orders.reduce(
      (groupedOrders, order) => {
        const cancelReasonCode = order.cancelReasonCode;
        groupedOrders[cancelReasonCode] = groupedOrders[cancelReasonCode] || [];
        groupedOrders[cancelReasonCode].push(order);
        return groupedOrders;
      },
      {} as { [key: string]: SubOrderControlListDto[] },
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
