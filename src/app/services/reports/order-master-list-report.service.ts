import { Injectable, OnDestroy } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ToasterService } from '@abp/ng.theme.shared';
import { FilterDateCategory, OrderReportService } from '@proxy/reports';
import {
  FilterPagedAndSortedOrderControlListResultRequestDto,
  orderStatusOptions,
  paymentStatusOptions,
  SubOrderControlListDto,
} from '@proxy/orders';
import { LocalizationService } from '@abp/ng.core';
import {
  REPORT_FONT_FILE_NAME,
  REPORT_FONT_NAME,
  REPORT_FONT_TYPE,
  REPORT_HEADER_BACKGROUND_COLOR,
  REPORT_HEADER_TEXT_COLOR,
  ROUNDING_PRECISION,
} from 'src/app/shared/constants';
import trebucFont from 'src/assets/fonts/trebuc-normal.js';
import { ReportFilterDto } from 'src/app/models/report-filter-dto';
import { paymentMethodOptions } from '@proxy/payment';
import { formatFilterItem } from './reports-utils';

@Injectable({
  providedIn: 'root',
})
export class OrderMasterListReportService implements OnDestroy {
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
    tableStartY: 95,
  };
  filters: ReportFilterDto;

  constructor(
    private http: HttpClient,
    private toasterService: ToasterService,
    private orderReportAppService: OrderReportService,
    private readonly localizationService: LocalizationService,
  ) {}

  private getEnumDisplayName(enumOptions: any[], enumValue: number): string {
    const unknownText = this.localizationService.instant('::Reports:Common:Unknown');
    const option = enumOptions.find(option => option.value === enumValue);
    return option ? option.key : unknownText;
  }

  generateReport(
    input: FilterPagedAndSortedOrderControlListResultRequestDto,
    filters: ReportFilterDto,
  ) {
    this.filters = filters;

    forkJoin([
      this.orderReportAppService.generateOrderMasterListReport(input),
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
          this.generateReportPdf(orders, logoBase64);
        };
      });
  }

  private generateReportPdf(orders: SubOrderControlListDto[], logoBase64: string): void {
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
    this.addOrderDetailsReport(doc, detailsReportBody, logoBase64, currentTime);

    doc.addPage();

    const summaryReportBody = this.getOrderSummaryReportBody(orders);
    this.addOrderSummaryReport(doc, summaryReportBody, logoBase64, currentTime);

    const fileName = this.localizationService.instant(
      '::Reports:OrderMasterListReport:DownloadableFileName',
    );
    doc.save(fileName);
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

  private addOrderDetailsReport(
    doc: jsPDF,
    body: (string | number)[][],
    logoBase64: string,
    currentTime: string,
  ) {
    const orderNumberColumnName = this.localizationService.instant('::Report:Column:OrderNumber');
    const orderTypeColumnName = this.localizationService.instant(
      '::Reports:StoreSalesAnalysis:OrderType',
    );
    const orderStatusColumnName = this.localizationService.instant('::Report:Column:OrderStatus');
    const deliveryTypeColumnName = this.localizationService.instant('::Report:Column:DeliveryType');
    const locationIDColumnName = this.localizationService.instant('::Report:Column:LocationID');
    const methodOfPaymentColumnName = this.localizationService.instant(
      '::Report:Column:MethodOfPayment',
    );
    const salesRepEmployeeIDColumnName = this.localizationService.instant(
      '::Report:Column:SalesRepEmployeeID',
    );
    const recipientNameColumnName = this.localizationService.instant(
      '::Report:Column:RecipientName',
    );
    const soldToNameColumnName = this.localizationService.instant('::Report:Column:SoldToName');
    const orderDateColumnName = this.localizationService.instant('::Report:Column:OrderDate');
    const deliveryDateColumnName = this.localizationService.instant('::Report:Column:DeliveryDate');
    const postDateColumnName = this.localizationService.instant('::Report:Column:PostDate');
    const merchandiseAmountColumnName = this.localizationService.instant(
      '::Report:Column:MerchandiseAmount',
    );
    const discountColumnName = this.localizationService.instant('::Report:Column:Discount');
    const deliveryFeeColumnName = this.localizationService.instant('::Report:Column:DeliveryFee');
    const serviceChargeColumnName = this.localizationService.instant(
      '::Report:Column:ServiceCharge',
    );
    const salesTaxColumnName = this.localizationService.instant('::Report:Column:SalesTax');
    const totalAmountColumnName = this.localizationService.instant('::Report:Column:TotalAmount');
    const detailsReportName = this.localizationService.instant(
      '::Reports:OrderMasterListReport:DetailsReportName',
    );

    autoTable(doc, {
      startY: this.reportConfig.tableStartY,
      head: [
        [
          orderNumberColumnName,
          orderTypeColumnName,
          orderStatusColumnName,
          deliveryTypeColumnName,
          locationIDColumnName,
          methodOfPaymentColumnName,
          salesRepEmployeeIDColumnName,
          recipientNameColumnName,
          soldToNameColumnName,
          orderDateColumnName,
          deliveryDateColumnName,
          postDateColumnName,
          merchandiseAmountColumnName,
          discountColumnName,
          deliveryFeeColumnName,
          serviceChargeColumnName,
          salesTaxColumnName,
          totalAmountColumnName,
        ],
      ],
      body: body,
      didDrawPage: data => {
        this.addPageHeader(doc, logoBase64, currentTime, data.pageNumber, detailsReportName);

        const filterBody = this.getFilterTableBody();
        this.addFilterTable(doc, filterBody);
      },
      tableWidth: 'wrap',
      headStyles: {
        halign: 'center',
        font: REPORT_FONT_NAME,
        fontStyle: REPORT_FONT_TYPE,
        fillColor: REPORT_HEADER_BACKGROUND_COLOR,
        textColor: REPORT_HEADER_TEXT_COLOR,
      },
      bodyStyles: { halign: 'center', font: REPORT_FONT_NAME, fontStyle: REPORT_FONT_TYPE },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 15 },
        2: { cellWidth: 15 },
        3: { cellWidth: 15 },
        4: { cellWidth: 10 },
        5: { cellWidth: 10 },
        6: { cellWidth: 20 },
        7: { cellWidth: 20 },
        8: { cellWidth: 15 },
        9: { cellWidth: 15 },
        10: { cellWidth: 20 },
        11: { cellWidth: 15 },
        12: { cellWidth: 15 },
        13: { cellWidth: 15 },
        14: { cellWidth: 15 },
        15: { cellWidth: 15 },
        16: { cellWidth: 15 },
        17: { cellWidth: 25 },
      },
      styles: {
        fontSize: this.reportConfig.tableFontSize,
        cellPadding: this.reportConfig.tableCellPadding,
        overflow: 'linebreak',
      },
      margin: { left: 6, right: 6, top: this.reportConfig.tableStartY },
    });
  }

  private getOrderDetailsReportBody(orders: SubOrderControlListDto[]) {
    const splitPaymentText = this.localizationService.instant(
      '::Report:Common:PaymentMethod:Split',
    );

    return orders.map(order => [
      order.orderNumber,
      this.localizationService.instant(`::Enum:OrderTypes.${Number(order.orderType)}`),
      this.getEnumDisplayName(orderStatusOptions, order.orderStatus),
      this.localizationService.instant(`::Enum:DeliveryCategory.${Number(order.deliveryCategory)}`),
      order.originalStoreCode,
      this.getPaymentMethod(order, splitPaymentText),
      order.salesRepresentative,
      order.recipientName,
      order.customerName,
      order.orderDate ? new Date(order.orderDate).toLocaleDateString() : '',
      order.deliveredDates,
      order.postDate ? new Date(order.postDate).toLocaleDateString() : '',
      `$${order.amount.toFixed(ROUNDING_PRECISION)}`,
      `$${order.discountAmount.toFixed(ROUNDING_PRECISION)}`,
      `$${order.deliveryFee.toFixed(ROUNDING_PRECISION)}`,
      `$${order.relayFee.toFixed(ROUNDING_PRECISION)}`,
      `$${order.taxAmount.toFixed(ROUNDING_PRECISION)}`,
      `$${order.totalAmount.toFixed(ROUNDING_PRECISION)}`,
    ]);
  }

  private getPaymentMethod(
    order: SubOrderControlListDto,
    splitPaymentText: string,
  ): string | number {
    if (!order.paymentMethod) return '';

    return order.isSplitPayment
      ? splitPaymentText
      : order.paymentMethod
        ? this.localizationService.instant(`::Enum:PaymentMethod.${Number(order.paymentMethod)}`)
        : '';
  }

  private addOrderSummaryReport(
    doc: jsPDF,
    groupedBody: any[],
    logoBase64: string,
    currentTime: string,
  ) {
    const lastPageCount = doc.getNumberOfPages() - 1;

    const orderTypeColumnName = this.localizationService.instant('::Report:Column:OrderType');
    const noColumnName = this.localizationService.instant('::Report:Column:No');
    const merchandiseAmountColumnName = this.localizationService.instant(
      '::Report:Column:MerchandiseAmount',
    );
    const discountColumnName = this.localizationService.instant('::Report:Column:Discount');
    const deliveryFeeColumnName = this.localizationService.instant('::Report:Column:DeliveryFee');
    const serviceChargeColumnName = this.localizationService.instant(
      '::Report:Column:ServiceCharge',
    );
    const salesTaxColumnName = this.localizationService.instant('::Report:Column:SalesTax');
    const totalAmountColumnName = this.localizationService.instant('::Report:Column:TotalAmount');
    const summaryReportName = this.localizationService.instant(
      '::Reports:OrderMasterListReport:SummaryReportName',
    );

    autoTable(doc, {
      startY: this.reportConfig.tableStartY,
      head: [
        [
          orderTypeColumnName,
          noColumnName,
          merchandiseAmountColumnName,
          discountColumnName,
          deliveryFeeColumnName,
          serviceChargeColumnName,
          salesTaxColumnName,
          totalAmountColumnName,
        ],
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

        const filterBody = this.getFilterTableBody();
        this.addFilterTable(doc, filterBody);
      },
      margin: { top: this.reportConfig.tableStartY },
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

  private getOrderSummaryReportBody(orders: SubOrderControlListDto[]) {
    const groupedOrders = this.groupOrdersByOrderType(orders);

    const body: any[] = [];

    let overallCount = 0;
    let overallTotalAmount = 0;
    let overallDiscountAmount = 0;
    let overallDeliveryFee = 0;
    let overallServiceCharge = 0;
    let overallTaxAmount = 0;
    let overallTotal = 0;

    Object.keys(groupedOrders).forEach(orderType => {
      const group = groupedOrders[orderType];

      overallCount += group.count;
      overallTotalAmount += group.totalAmount;
      overallDiscountAmount += group.discountAmount;
      overallDeliveryFee += group.deliveryFee;
      overallServiceCharge += group.serviceCharge;
      overallTaxAmount += group.taxAmount;
      overallTotal += group.total;

      const orderTypeName = this.localizationService.instant(
        `::Enum:OrderTypes.${Number(orderType)}`,
      );

      body.push([
        orderTypeName,
        group.count,
        `$${group.totalAmount.toFixed(ROUNDING_PRECISION)}`,
        `$${group.discountAmount.toFixed(ROUNDING_PRECISION)}`,
        `$${group.deliveryFee.toFixed(ROUNDING_PRECISION)}`,
        `$${group.serviceCharge.toFixed(ROUNDING_PRECISION)}`,
        `$${group.taxAmount.toFixed(ROUNDING_PRECISION)}`,
        `$${group.total.toFixed(ROUNDING_PRECISION)}`,
      ]);
    });

    const locationTotalText = this.localizationService.instant('::Reports:Common:SubTotal');
    body.push([
      locationTotalText,
      overallCount,
      `$${overallTotalAmount.toFixed(ROUNDING_PRECISION)}`,
      `$${overallDiscountAmount.toFixed(ROUNDING_PRECISION)}`,
      `$${overallDeliveryFee.toFixed(ROUNDING_PRECISION)}`,
      `$${overallServiceCharge.toFixed(ROUNDING_PRECISION)}`,
      `$${overallTaxAmount.toFixed(ROUNDING_PRECISION)}`,
      `$${overallTotal.toFixed(ROUNDING_PRECISION)}`,
    ]);

    return body;
  }

  private groupOrdersByOrderType(orders: SubOrderControlListDto[]): {
    [key: string]: {
      count: number;
      totalAmount: number;
      discountAmount: number;
      deliveryFee: number;
      serviceCharge: number;
      taxAmount: number;
      total: number;
    };
  } {
    return orders.reduce(
      (groupedOrders, order) => {
        const orderType = order.orderType;

        if (!groupedOrders[orderType]) {
          groupedOrders[orderType] = {
            count: 0,
            totalAmount: 0,
            discountAmount: 0,
            deliveryFee: 0,
            serviceCharge: 0,
            taxAmount: 0,
            total: 0,
          };
        }

        groupedOrders[orderType].count += 1;
        groupedOrders[orderType].totalAmount += order.amount || 0;
        groupedOrders[orderType].discountAmount += order.discountAmount || 0;
        groupedOrders[orderType].serviceCharge += order.relayFee || 0;
        groupedOrders[orderType].deliveryFee += order.deliveryFee || 0;
        groupedOrders[orderType].taxAmount += order.taxAmount || 0;
        groupedOrders[orderType].total =
          groupedOrders[orderType].totalAmount -
            groupedOrders[orderType].discountAmount +
            groupedOrders[orderType].serviceCharge +
            groupedOrders[orderType].deliveryFee +
            groupedOrders[orderType].taxAmount || 0;

        return groupedOrders;
      },
      {} as {
        [key: string]: {
          count: number;
          totalAmount: number;
          discountAmount: number;
          deliveryFee: number;
          serviceCharge: number;
          taxAmount: number;
          total: number;
        };
      },
    );
  }

  private getFilterTableBody(): any[][] {
    const allSelectionText = this.localizationService.instant(
      '::Reports:OrderReport:Filter:AllSelect',
    );

    const deliveryDateText = this.localizationService.instant('::Reports:Common:DeliveryDate');
    const orderDateText = this.localizationService.instant('::Reports:Common:OrderDate');
    const storesFilter = this.localizationService.instant('::Reports:OrderReport:Filter:Stores');
    const employeeClassFilter = this.localizationService.instant('::Reports:Fields:EmployeeClass');
    const orderTypeFilter = this.localizationService.instant(
      '::Reports:StoreSalesAnalysis:OrderType',
    );
    const orderStatusFilter = this.localizationService.instant('::OrderControl:OrderStatus');
    const paymentMethodFilter = this.localizationService.instant('::Report:Filter:PaymentMethod');
    const paymentStatusFilter = this.localizationService.instant('::Report:Filter:PaymentStatus');
    const occasionFilter = this.localizationService.instant('::Report:Filter:Occasion');
    const deliveryTypeFilter = this.localizationService.instant('::Report:Filter:DeliveryType');
    const keywordFilter = this.localizationService.instant('::Reports:OrderReport:Filter:Keyword');
    const priceFilter = this.localizationService.instant('::Reports:Common:PriceSearch');

    const {
      filterDateCategory,
      fromDate,
      toDate,
      storeNames,
      employeeClassNames,
      orderTypeNames,
      orderStatus,
      paymentMethod,
      paymentStatus,
      occasionCode,
      deliveryType,
      maxPriceRange,
      minPriceRange,
      keyword,
    } = this.filters;

    const stores = formatFilterItem(storeNames, allSelectionText);
    const employeeClasses = formatFilterItem(employeeClassNames, allSelectionText);
    const orderTypeList = formatFilterItem(orderTypeNames, allSelectionText);
    const priceRangeFilter =
      maxPriceRange && minPriceRange ? `${minPriceRange} to ${maxPriceRange}` : allSelectionText;
    const fromDateValue = new Date(fromDate).toLocaleDateString();
    const toDateValue = new Date(toDate).toLocaleDateString();
    const dateFilter = `${fromDateValue} To ${toDateValue}`;
    const orderStatusName = orderStatus
      ? this.getEnumDisplayName(orderStatusOptions, orderStatus)
      : allSelectionText;
    const paymentMethodName = paymentMethod
      ? this.getEnumDisplayName(paymentMethodOptions, paymentMethod)
      : allSelectionText;
    const paymentStatusName = paymentStatus
      ? this.getEnumDisplayName(paymentStatusOptions, paymentStatus)
      : allSelectionText;
    const occasionName = occasionCode
      ? this.localizationService.instant(`::Enum:OccasionCode.${occasionCode}`)
      : allSelectionText;
    const deliveryTypeName = deliveryType
      ? this.localizationService.instant(`::Enum:DeliveryCategory.${Number(deliveryType)}`)
      : allSelectionText;

    return [
      [
        `${filterDateCategory === FilterDateCategory.OrderDate ? orderDateText : deliveryDateText}`,
        dateFilter,
        storesFilter,
        stores,
      ],
      [`${employeeClassFilter}: `, employeeClasses, `${orderTypeFilter}: `, orderTypeList],
      [`${orderStatusFilter}: `, orderStatusName, `${paymentMethodFilter}: `, paymentMethodName],
      [`${paymentStatusFilter}: `, paymentStatusName, `${occasionFilter}: `, occasionName],
      [`${deliveryTypeFilter}: `, deliveryTypeName, `${keywordFilter}`, keyword],
      [`${priceFilter}: `, priceRangeFilter],
    ];
  }

  private addFilterTable(doc: jsPDF, filterBody: any[][]): void {
    autoTable(doc, {
      body: filterBody,
      startY: this.reportConfig.tableStartY - 50,
      theme: 'plain',
      styles: {
        fontSize: this.reportConfig.tableFontSize + 4,
        cellPadding: this.reportConfig.tableCellPadding,
      },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'right', minCellWidth: 40 },
        1: { halign: 'left', minCellWidth: 80 },
        2: { fontStyle: 'bold', halign: 'right', minCellWidth: 60 },
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
