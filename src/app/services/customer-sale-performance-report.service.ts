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
import { LocalizationService } from '@abp/ng.core';
import {
  REPORT_FONT_FILE_NAME,
  REPORT_FONT_NAME,
  REPORT_FONT_TYPE,
  REPORT_HEADER_BACKGROUND_COLOR,
  REPORT_HEADER_TEXT_COLOR,
  ROUNDING_PRECISION,
} from '../shared/constants';
import { DateRangeType } from '../models/date-range-type';
import trebucFont from 'src/assets/fonts/trebuc-normal.js';
import { getDateFromDateTime } from '../shared/date-time-utils';
import { formatFilterItem } from './reports/reports-utils';

@Injectable({
  providedIn: 'root',
})
export class CustomerSalePerformanceReportService implements OnDestroy {
  private readonly logoUrl = 'assets/images/logo/ffc-logo.jpg';
  destroy$: Subject<void> = new Subject();
  firstDateRange: DateRangeType;
  secondDateRange: DateRangeType;
  readonly reportConfig = {
    imageX: 123,
    imageY: 10,
    imageWidth: 50,
    imageHeight: 20,
    tableFontSize: 10,
    tableCellPadding: 1,
    reportTitleFontSize: 18,
    reportTitleX: 148.5,
    reportTitleY: 40,
    filterSectionY: 45,
    tableStartY: 58,
  };
  selectedCustomerNames: string[] = [];
  selectedCustomerClasses: string[] = [];

  constructor(
    private http: HttpClient,
    private toasterService: ToasterService,
    private orderService: OrderService,
    private readonly localizationService: LocalizationService,
  ) {}

  generateReport(
    input: FilterPagedAndSortedOrderControlListResultRequestDto,
    firstDateRange: DateRangeType,
    secondDateRange: DateRangeType,
    selectedCustomerNames: string[],
    selectedCustomerClasses: string[],
  ) {
    this.firstDateRange = firstDateRange;
    this.secondDateRange = secondDateRange;
    this.selectedCustomerClasses = selectedCustomerClasses;
    this.selectedCustomerNames = selectedCustomerNames;

    forkJoin([
      this.orderService.generateCustomerSalePerformanceReport(input),
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
          this.generateProductSalesComparisonByCustomersReportPdf(orders, logoBase64);
        };
      });
  }

  private generateProductSalesComparisonByCustomersReportPdf(
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

    const reportBody = this.getReportBody(orders);
    this.addReportContents(doc, reportBody, logoBase64, currentTime);

    const fileName = this.localizationService.instant(
      '::Reports:CustomerSalePerformance:DownloadableFileName',
    );
    doc.save(fileName);
  }

  private addReportContents(doc: jsPDF, body: any, logoBase64: string, currentTime: string) {
    const customerIdColumnName = this.localizationService.instant(
      '::Reports:CustomerSalePerformance:CustomerId',
    );
    const customerNameColumnName = this.localizationService.instant(
      '::Reports:CustomerSalePerformance:CustomerName',
    );
    const amountColumnName = this.localizationService.instant(
      '::Reports:CustomerSalePerformance:Amt',
    );
    const ordersColumnName = this.localizationService.instant(
      '::Reports:CustomerSalePerformance:Orders',
    );
    const averageColumnName = this.localizationService.instant(
      '::Reports:CustomerSalePerformance:Avg',
    );
    const deviationColumnName = this.localizationService.instant(
      '::Reports:CustomerSalePerformance:Dev',
    );
    const reportName = this.localizationService.instant(
      '::Reports:CustomerSalePerformance:ReportName',
    );

    const firstFromDate = this.formatDate(this.firstDateRange.fromDate);
    const firstToDate = this.formatDate(this.firstDateRange.toDate);
    const secondFromDate = this.formatDate(this.secondDateRange.fromDate);
    const secondToDate = this.formatDate(this.secondDateRange.toDate);

    const firstSelectedDateInfo =
      firstFromDate && firstToDate ? `${firstFromDate} To ${firstToDate}` : '';
    const secondSelectedDateInfo =
      secondFromDate && secondToDate ? `${secondFromDate} To ${secondToDate}` : '';

    const formattedBody = body.map(row => [
      row[0],
      row[1],
      '',
      `$${row[2]}`,
      row[3],
      `$${row[4]}`,
      '',
      `$${row[5]}`,
      row[6],
      `$${row[7]}`,
      '',
      `${row[8]}%`,
    ]);

    autoTable(doc, {
      startY: this.reportConfig.tableStartY,
      head: [
        [
          { content: '', colSpan: 2 },
          { content: '' },
          { content: firstSelectedDateInfo, colSpan: 3 },
          { content: '' },
          { content: secondSelectedDateInfo, colSpan: 3 },
          { content: '' },
          { content: '', colSpan: 1 },
        ],
        [
          customerIdColumnName,
          customerNameColumnName,
          '',
          amountColumnName,
          ordersColumnName,
          averageColumnName,
          '',
          amountColumnName,
          ordersColumnName,
          averageColumnName,
          '',
          deviationColumnName,
        ],
      ],
      body: formattedBody,
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
      margin: { top: this.reportConfig.tableStartY },
      didDrawPage: data => {
        this.addPageHeader(doc, logoBase64, currentTime, data.pageNumber, reportName);

        const filterBody = this.getFilterTableBody();
        this.addFilterTable(doc, filterBody);
      },
    });
  }

  private formatDate(date: Date) {
    return date ? new Date(date).toLocaleDateString() : '';
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
    const firstSetOrders = this.filterAndGroupOrders(orders, this.firstDateRange);
    const secondSetOrders = this.filterAndGroupOrders(orders, this.secondDateRange);

    const emptyCustomerText = this.localizationService.instant('::Reports:Filters:EmptyCustomer');

    const finalGroupOrders = orders.reduce(
      (grouped, order) => {
        if (!grouped[order.customerId]) {
          grouped[order.customerId] = [];
        }
        grouped[order.customerId].push(order);
        return grouped;
      },
      {} as Record<string, SubOrderControlListDto[]>,
    );

    let totalFirstUnits = 0;
    let totalFirstUnitPrice = 0;
    let totalSecondUnits = 0;
    let totalSecondUnitPrice = 0;

    const bodyContents = Object.keys(finalGroupOrders)
      .map(customerId => {
        const firstSet = firstSetOrders[customerId] || {
          totalUnits: 0,
          totalUnitPrice: 0,
          avgUnitPrice: 0,
        };
        const secondSet = secondSetOrders[customerId] || {
          totalUnits: 0,
          totalUnitPrice: 0,
          avgUnitPrice: 0,
        };

        totalFirstUnits += firstSet.totalUnits;
        totalFirstUnitPrice += firstSet.totalUnitPrice;
        totalSecondUnits += secondSet.totalUnits;
        totalSecondUnitPrice += secondSet.totalUnitPrice;

        const diffUnitPrice = firstSet.totalUnitPrice - secondSet.totalUnitPrice;
        const diffAvgPrice = firstSet.totalUnitPrice
          ? (diffUnitPrice / firstSet.totalUnitPrice) * 100
          : 0;

        const customerName = finalGroupOrders[customerId][0]?.customerName || emptyCustomerText;
        const acctId = customerId && customerId !== 'null' ? customerId : '';

        return {
          acctId,
          customerName,
          firstTotalUnitPrice: firstSet.totalUnitPrice,
          firstTotalUnits: firstSet.totalUnits,
          firstAvgUnitPrice: firstSet.avgUnitPrice,
          secondTotalUnitPrice: secondSet.totalUnitPrice,
          secondTotalUnits: secondSet.totalUnits,
          secondAvgUnitPrice: secondSet.avgUnitPrice,
          diffAvgPrice,
          row: [
            acctId,
            customerName,
            firstSet.totalUnitPrice.toFixed(ROUNDING_PRECISION),
            firstSet.totalUnits,
            firstSet.avgUnitPrice.toFixed(ROUNDING_PRECISION),
            secondSet.totalUnitPrice.toFixed(ROUNDING_PRECISION),
            secondSet.totalUnits,
            secondSet.avgUnitPrice.toFixed(ROUNDING_PRECISION),
            diffAvgPrice.toFixed(1),
          ],
        };
      })
      .sort((a, b) => {
        return a.acctId.localeCompare(b.acctId);
      })
      .map(item => item.row);

    this.addLocationTotal(
      totalFirstUnits,
      totalFirstUnitPrice,
      totalSecondUnits,
      totalSecondUnitPrice,
      bodyContents,
    );

    return bodyContents;
  }

  private addLocationTotal(
    firstTotalUnits: number,
    firstTotalUnitPrice: number,
    secondTotalUnits: number,
    secondTotalUnitPrice: number,
    bodyContents: any[],
  ) {
    const locationTotalText = this.localizationService.instant(
      '::Reports:CustomerSalePerformance:SubTotals',
    );

    const avgFirstUnitPrice = firstTotalUnits ? firstTotalUnitPrice / firstTotalUnits : 0;
    const avgSecondUnitPrice = secondTotalUnits ? secondTotalUnitPrice / secondTotalUnits : 0;

    const diffTotalUnitPrice = firstTotalUnitPrice - secondTotalUnitPrice;
    const diffAvgUnitPrice = firstTotalUnitPrice
      ? (diffTotalUnitPrice / firstTotalUnitPrice) * 100
      : 0;

    bodyContents.push([
      '',
      locationTotalText,
      firstTotalUnitPrice.toFixed(ROUNDING_PRECISION),
      firstTotalUnits,
      avgFirstUnitPrice.toFixed(ROUNDING_PRECISION),
      secondTotalUnitPrice.toFixed(ROUNDING_PRECISION),
      secondTotalUnits,
      avgSecondUnitPrice.toFixed(ROUNDING_PRECISION),
      diffAvgUnitPrice.toFixed(1),
    ]);
  }

  private filterAndGroupOrders(orders: SubOrderControlListDto[], dateRange: DateRangeType) {
    return orders
      .filter(({ deliveredDate }) => {
        const date = getDateFromDateTime(deliveredDate);
        const fromDate = getDateFromDateTime(dateRange.fromDate);
        const toDate = getDateFromDateTime(dateRange.toDate);
        return date >= fromDate && date <= toDate;
      })
      .reduce(
        (grouped, order) => {
          const { customerId, totalUnitPrice, totalUnits } = order;
          if (!grouped[customerId]) {
            grouped[customerId] = { ...order };
          } else {
            grouped[customerId].totalUnitPrice += totalUnitPrice;
            grouped[customerId].totalUnits += totalUnits;
            grouped[customerId].avgUnitPrice =
              grouped[customerId].totalUnitPrice / grouped[customerId].totalUnits;
          }
          return grouped;
        },
        {} as Record<string, SubOrderControlListDto>,
      );
  }

  private getFilterTableBody(): any[][] {
    const allSelectionText = this.localizationService.instant(
      '::Reports:OrderReport:Filter:AllSelect',
    );

    const customerFilter = this.localizationService.instant('::Reports:Common:CustomersFilter');
    const customerClassesFilter = this.localizationService.instant(
      '::Reports:Filters:CustomerClasses',
    );

    const customerNames = formatFilterItem(this.selectedCustomerNames, allSelectionText);
    const classNames = formatFilterItem(this.selectedCustomerClasses, allSelectionText);

    return [[customerClassesFilter, classNames, customerFilter, customerNames]];
  }

  private addFilterTable(doc: jsPDF, filterBody: any[][]): void {
    autoTable(doc, {
      body: filterBody,
      startY: this.reportConfig.filterSectionY,
      theme: 'plain',
      styles: {
        fontSize: 11,
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
