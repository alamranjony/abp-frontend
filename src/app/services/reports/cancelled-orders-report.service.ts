import { Injectable, OnDestroy } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ToasterService } from '@abp/ng.theme.shared';
import { FilterDateCategory, OrderReportService } from '@proxy/reports';
import {
  FilterPagedAndSortedOrderControlListResultRequestDto,
  orderTypeOptions,
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
import { formatFilterItem } from './reports-utils';

@Injectable({
  providedIn: 'root',
})
export class CancelledOrdersReportService implements OnDestroy {
  private readonly logoUrl = 'assets/images/logo/ffc-logo.jpg';
  destroy$: Subject<void> = new Subject();
  readonly reportConfig = {
    imageX: 123,
    imageY: 10,
    imageWidth: 50,
    imageHeight: 20,
    reportTitleFontSize: 18,
    reportTitleX: 148.5,
    reportTitleY: 40,
    tableStartY: 70,
    filterTableFontSize: 10,
    filterTableCellPadding: 2,
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

  generateCancelledOrderReport(
    input: FilterPagedAndSortedOrderControlListResultRequestDto,
    filters: ReportFilterDto,
  ) {
    this.filters = filters;

    forkJoin([
      this.orderReportAppService.generateCancelledOrdersReport(input),
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
          this.generateCancelledOrderReportPdf(orders, logoBase64);
        };
      });
  }

  private generateCancelledOrderReportPdf(
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

    const detailsReportBody = this.getCancelledOrderDetailsReportBody(orders);
    this.addCancelledOrderDetailsReport(doc, detailsReportBody, logoBase64, currentTime);

    doc.addPage();

    const summaryReportBody = this.getCancelledOrderSummaryReportBody(orders);

    this.addCancelledOrderSummaryReport(doc, summaryReportBody, logoBase64, currentTime);

    const fileName = this.localizationService.instant(
      '::Reports:CancelledOrderReport:DownloadableFileName',
    );
    doc.save(fileName);
  }

  private getCancelledOrderDetailsReportBody(orders: SubOrderControlListDto[]) {
    return orders.map(order => [
      order.salesRepresentative,
      order.orderNumber,
      this.getEnumDisplayName(orderTypeOptions, order.orderType),
      order.orderDate ? new Date(order.orderDate).toLocaleDateString() : '',
      order.deliveredDate ? new Date(order.deliveredDate).toLocaleDateString() : '',
      order.cancelDate ? new Date(order.cancelDate).toLocaleDateString() : '',
      `$${order.totalAmount.toFixed(ROUNDING_PRECISION)}`,
      order.cancelReasonDescription,
      order.additionalComment,
    ]);
  }

  private addCancelledOrderDetailsReport(
    doc: jsPDF,
    body: (string | number)[][],
    logoBase64: string,
    currentTime: string,
  ) {
    const employee = this.localizationService.instant('::Reports:CancelledOrderReport:employee');
    const orderType = this.localizationService.instant('::Reports:CancelledOrderReport:OrderType');
    const cancelDate = this.localizationService.instant(
      '::Reports:CancelledOrderReport:cancelDate',
    );
    const orderAmount = this.localizationService.instant(
      '::Reports:CancelledOrderReport:orderAmount',
    );
    const reasonCode = this.localizationService.instant(
      '::Reports:CancelledOrderReport:reasonCode',
    );
    const additionalComment = this.localizationService.instant(
      '::Reports:CancelledOrderReport:additionalComment',
    );
    const orderDate = this.localizationService.instant('::Reports:CancelledOrderReport:orderDate');
    const orderNo = this.localizationService.instant('::Reports:CancelledOrderReport:orderNo');
    const deliveryDate = this.localizationService.instant(
      '::Reports:CancelledOrderReport:DeliveryDate',
    );
    const detailsReportName = this.localizationService.instant(
      '::Reports:CancelledOrderReport:DetailsReportName',
    );

    autoTable(doc, {
      startY: this.reportConfig.tableStartY,
      head: [
        [
          employee,
          orderNo,
          orderType,
          orderDate,
          deliveryDate,
          cancelDate,
          orderAmount,
          reasonCode,
          additionalComment,
        ],
      ],
      body: body,
      didDrawPage: data => {
        this.addPageHeader(doc, logoBase64, currentTime, data.pageNumber, detailsReportName);

        const filterBody = this.getCancelledOrderFilterTableBody();

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

  private getCancelledOrderSummaryReportBody(orders: SubOrderControlListDto[]) {
    const groupedOrders = this.groupOrdersByReasonCode(orders);

    const body: any[] = [];

    let totalOrderUnits = 0;
    let totalOrderAmount = 0;

    Object.keys(groupedOrders).forEach(cancelReasonCode => {
      const group = groupedOrders[cancelReasonCode];
      const reasonDesc = group[0]?.cancelReasonDescription || '';

      const totalAmount = group.reduce((total, order) => total + order.totalAmount, 0);
      const totalQuantity = group.length;

      totalOrderUnits += totalQuantity;
      totalOrderAmount += totalAmount;

      body.push([
        reasonDesc,
        0,
        '$0',
        totalQuantity,
        `$${totalAmount.toFixed(ROUNDING_PRECISION)}`,
      ]);
    });

    const subTotalColName = this.localizationService.instant('::Reports:Common:GrandTotal');
    body.push([
      subTotalColName,
      '0',
      '$0',
      totalOrderUnits,
      `$${totalOrderAmount.toFixed(ROUNDING_PRECISION)}`,
    ]);

    return body;
  }

  private addCancelledOrderSummaryReport(
    doc: jsPDF,
    groupedBody: any[],
    logoBase64: string,
    currentTime: string,
  ) {
    const lastPageCount = doc.getNumberOfPages() - 1;

    const description = this.localizationService.instant(
      '::Reports:CancelledOrderReport:cancelReason',
    );
    const proposalNo = this.localizationService.instant(
      '::Reports:CancelledOrderReport:ProposalNo',
    );
    const proposalDollarAmount = this.localizationService.instant(
      '::Reports:CancelledOrderReport:ProposalDollarAmount',
    );
    const orderNo = this.localizationService.instant('::Reports:CancelledOrderReport:orderNo');
    const orderDollarAmount = this.localizationService.instant(
      '::Reports:CancelledOrderReport:OrderDollarAmount',
    );
    const summaryReportName = this.localizationService.instant(
      '::Reports:CancelledOrderReport:SummaryReportName',
    );

    autoTable(doc, {
      startY: this.reportConfig.tableStartY,
      head: [[description, proposalNo, proposalDollarAmount, orderNo, orderDollarAmount]],
      body: groupedBody,
      didDrawPage: data => {
        this.addPageHeader(
          doc,
          logoBase64,
          currentTime,
          data.pageNumber + lastPageCount,
          summaryReportName,
        );

        const filterBody = this.getCancelledOrderFilterTableBody();
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

  private getCancelledOrderFilterTableBody(): any[][] {
    const {
      filterDateCategory,
      fromDate,
      toDate,
      storeNames,
      orderTypeNames,
      cancellationReasonNames,
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
    const storeLocation = formatFilterItem(storeNames, allSelectionText);
    const cancelReasons = formatFilterItem(cancellationReasonNames, allSelectionText);
    const reasonCode = this.localizationService.instant('::Reports:OrderReport:Filter:ReasonCode');

    return [
      [
        `${filterDateCategory === FilterDateCategory.OrderDate ? orderDateText : deliveryDateText}`,
        dateFilter,
        storesFilter,
        storeLocation,
      ],
      [`${orderTypeFilter}: `, orderTypeList, reasonCode, cancelReasons],
    ];
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

  private addFilterTable(doc: jsPDF, filterBody: any[][]): void {
    autoTable(doc, {
      body: filterBody,
      startY: 50,
      theme: 'plain',
      styles: {
        fontSize: this.reportConfig.filterTableFontSize,
        cellPadding: this.reportConfig.filterTableCellPadding,
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
