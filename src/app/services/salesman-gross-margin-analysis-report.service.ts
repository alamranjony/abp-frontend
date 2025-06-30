import { Injectable, OnDestroy } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ToasterService } from '@abp/ng.theme.shared';
import {
  FilterPagedAndSortedOrderControlListResultRequestDto,
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
import trebucFont from 'src/assets/fonts/trebuc-normal.js';
import { SalesAnalysisReportService } from '@proxy/reports';
import { formatFilterItem } from './reports/reports-utils';

@Injectable({
  providedIn: 'root',
})
export class SalesmanGrossMarginAnalysisReportService implements OnDestroy {
  private readonly logoUrl = 'assets/images/logo/ffc-logo.jpg';
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
    salesAmtAndAvgWidth: 20,
    unitsWidth: 10,
    filterSectionY: 45,
    tableStartY: 83,
  };
  selectedSalespersonNames: string[] = [];
  selectedCustomerNames: string[] = [];
  selectedProductDepartmentNames: string[] = [];
  selectedProductTypeNames: string[] = [];
  isOverallTotalsOnly: boolean;
  isPrintByTypeOnly: boolean;
  minGMRange: number;
  maxGMRange: number;
  destroy$: Subject<void> = new Subject();

  constructor(
    private http: HttpClient,
    private toasterService: ToasterService,
    private salesAnalysisReportService: SalesAnalysisReportService,
    private localizationService: LocalizationService,
  ) {}

  generateReport(
    input: FilterPagedAndSortedOrderControlListResultRequestDto,
    customers: string[],
    salesPersonNames: string[],
    productTypeNames: string[],
    productDeptNames: string[],
    isOverallTotalsOnly: boolean,
    isPrintByTypeOnly: boolean,
    minGMRange: number,
    maxGMRange: number,
  ) {
    this.selectedCustomerNames = customers;
    this.selectedSalespersonNames = salesPersonNames;
    this.selectedProductTypeNames = productTypeNames;
    this.selectedProductDepartmentNames = productDeptNames;
    this.isOverallTotalsOnly = isOverallTotalsOnly;
    this.isPrintByTypeOnly = isPrintByTypeOnly;
    this.minGMRange = minGMRange;
    this.maxGMRange = maxGMRange;

    forkJoin([
      this.salesAnalysisReportService.generateSalesmanGrossMarginAnalysisReport(input),
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
          this.generateReportPdf(orders, logoBase64, input);
        };
      });
  }

  private generateReportPdf(
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

    let grandTotal = {
      totalSalesAmt: 0,
      totalQuantity: 0,
      totalUnitPrice: 0,
      totalUnitCost: 0,
      totalCOGS: 0,
      totalGM: 0,
      totalPct: 0,
    };

    const grandTotalText = this.localizationService.instant(
      '::Reports:SalesmanGrossMarginAnalysis:GrandTotal',
    );
    const salesRepTotalText = this.localizationService.instant(
      '::Reports:SalesmanGrossMarginAnalysis:SalesRepTotal',
    );

    if (!this.isPrintByTypeOnly && !this.isOverallTotalsOnly) {
      // details report
      const salesRepDetailsOrderEntries = Object.entries(this.groupOrdersBySalesman(orders));

      salesRepDetailsOrderEntries.forEach(([salesRepId, salesRepOrders], index) => {
        const salesRepName =
          orders.find(c => c.salesRepresentativeId === salesRepId)?.salesRepresentative || '';
        const reportBody = this.getDetailsReportBody(salesRepOrders);

        let salesRepTotal = {
          totalSalesAmt: 0,
          totalQuantity: 0,
          totalUnitPrice: 0,
          totalUnitCost: 0,
          totalCOGS: 0,
          totalGM: 0,
          totalPct: 0,
        };

        this.calculateGroupTotals(reportBody, salesRepTotal, false);
        this.addGroupTotals(salesRepTotal, reportBody, salesRepTotalText, false);

        this.addDetailsReportContents(
          doc,
          reportBody,
          logoBase64,
          currentTime,
          input,
          salesRepName,
          index,
        );

        if (index < salesRepDetailsOrderEntries.length - 1) {
          doc.addPage();
        }
      });

      doc.addPage();
    }

    // summary report
    const summaryReportBody = this.getSummaryReportBody(orders);
    this.calculateGroupTotals(summaryReportBody, grandTotal, true);
    this.addGroupTotals(grandTotal, summaryReportBody, grandTotalText, true);
    this.addSummaryReportContents(doc, summaryReportBody, logoBase64, currentTime, input);

    const fileName = this.localizationService.instant(
      '::Reports:SalesmanGrossMarginAnalysis:DownloadableFileName',
    );
    doc.save(fileName);
  }

  private addGroupTotals(
    grandTotal: {
      totalSalesAmt: number;
      totalQuantity: number;
      totalUnitPrice: number;
      totalUnitCost: number;
      totalCOGS: number;
      totalGM: number;
      totalPct: number;
    },
    reportBody: (string | number)[][],
    columnText: string,
    isGrandTotal: boolean,
  ) {
    const locationTotalRow = [
      columnText,
      '',
      grandTotal.totalSalesAmt.toFixed(ROUNDING_PRECISION),
      grandTotal.totalQuantity,
      grandTotal.totalUnitPrice.toFixed(ROUNDING_PRECISION),
      grandTotal.totalUnitCost.toFixed(ROUNDING_PRECISION),
      grandTotal.totalCOGS.toFixed(ROUNDING_PRECISION),
      grandTotal.totalGM.toFixed(ROUNDING_PRECISION),
      grandTotal.totalPct.toFixed(1),
    ];

    if (isGrandTotal) {
      locationTotalRow.splice(1, 1);
    }

    reportBody.push(locationTotalRow);
  }

  private calculateGroupTotals(
    reportBody: (string | number)[][],
    grandTotal: {
      totalSalesAmt: number;
      totalQuantity: number;
      totalUnitPrice: number;
      totalUnitCost: number;
      totalCOGS: number;
      totalGM: number;
      totalPct: number;
    },
    isGrandTotal: boolean,
  ) {
    reportBody.slice(0, -1).forEach(row => {
      const offset = isGrandTotal ? -1 : 0;

      grandTotal.totalSalesAmt += parseFloat(row[2 + offset] as string);
      grandTotal.totalQuantity += parseFloat(row[3 + offset] as string);
      grandTotal.totalUnitPrice += parseFloat(row[4 + offset] as string);
      grandTotal.totalUnitCost += parseFloat(row[5 + offset] as string);
      grandTotal.totalCOGS = grandTotal.totalQuantity * grandTotal.totalUnitCost;
      grandTotal.totalGM = grandTotal.totalSalesAmt - grandTotal.totalCOGS;
      grandTotal.totalPct = (grandTotal.totalGM / grandTotal.totalSalesAmt) * 100;
    });
  }

  private addDetailsReportContents(
    doc: jsPDF,
    body: (string | number)[][],
    logoBase64: string,
    currentTime: string,
    input: FilterPagedAndSortedOrderControlListResultRequestDto,
    salesRep: string,
    index: number,
  ) {
    const formattedBody = body.map(row => {
      return [
        row[0],
        row[1],
        `$${row[2]}`,
        row[3],
        `$${row[4]}`,
        `$${row[5]}`,
        `$${row[6]}`,
        `$${row[7]}`,
        `${row[8]}%`,
      ];
    });

    const lastPageCount = index > 0 ? doc.getNumberOfPages() - 1 : 0;

    const salesman = this.localizationService.instant(
      '::Reports:SalesmanGrossMarginAnalysis.Salesman',
    );
    const emptySalesman = this.localizationService.instant(
      '::Reports:SalesmanGrossMarginAnalysis.EmptySalesman',
    );

    const salesmanKey = salesRep ? `${salesman} ${salesRep}` : emptySalesman;

    doc.setFontSize(14);
    doc.text(salesmanKey, 14, this.reportConfig.tableStartY - 5);

    const productCodeColumnName = this.localizationService.instant(
      '::Reports:CustomerProductAnalysis:ProductCode',
    );
    const productDescriptionColumnName = this.localizationService.instant(
      '::Reports:CustomerProductAnalysis:ProductDescription',
    );
    const salesAmtColumnName = this.localizationService.instant(
      '::Reports:ProductSalesComparisons:SalesAmount',
    );
    const qty = this.localizationService.instant('::Reports:SalesmanGrossMarginAnalysis.QtySold');
    const unitPrice = this.localizationService.instant(
      '::Reports:SalesmanGrossMarginAnalysis.UnitPrice',
    );
    const unitCost = this.localizationService.instant(
      '::Reports:SalesmanGrossMarginAnalysis.UnitCost',
    );
    const cogs = this.localizationService.instant('::Reports:SalesmanGrossMarginAnalysis.COGS');
    const gm = this.localizationService.instant('::Reports:SalesmanGrossMarginAnalysis.GM');
    const pct = this.localizationService.instant('::Reports:SalesmanGrossMarginAnalysis.Pct');

    const reportName = this.localizationService.instant(
      '::Reports:SalesmanGrossMarginAnalysis:ReportName',
    );

    autoTable(doc, {
      startY: this.reportConfig.tableStartY,
      head: [
        [
          productCodeColumnName,
          productDescriptionColumnName,
          salesAmtColumnName,
          qty,
          unitPrice,
          unitCost,
          cogs,
          gm,
          pct,
        ],
      ],
      body: formattedBody,
      didDrawPage: data => {
        this.addPageHeader(
          doc,
          logoBase64,
          currentTime,
          lastPageCount + data.pageNumber,
          reportName,
        );

        const filterBody = this.getFilterTableBody(input);

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

  private addSummaryReportContents(
    doc: jsPDF,
    body: (string | number)[][],
    logoBase64: string,
    currentTime: string,
    input: FilterPagedAndSortedOrderControlListResultRequestDto,
  ) {
    const formattedBody = body.map(row => {
      return [row[0], `$${row[1]}`, row[2]];
    });

    const lastPageCount = doc.getNumberOfPages();

    const productTypeColumnName = this.localizationService.instant(
      '::Reports:ProductTypeComparisons:Filter:ProductType',
    );
    const salesAmtColumnName = this.localizationService.instant(
      '::Reports:ProductSalesComparisons:SalesAmount',
    );
    const qty = this.localizationService.instant('::Reports:SalesmanGrossMarginAnalysis.QtySold');

    const reportName = this.localizationService.instant(
      '::Reports:SalesmanGrossMarginAnalysis:ReportName',
    );

    autoTable(doc, {
      startY: this.reportConfig.tableStartY - 10,
      head: [[productTypeColumnName, salesAmtColumnName, qty]],
      body: formattedBody,
      didDrawPage: data => {
        this.addPageHeader(
          doc,
          logoBase64,
          currentTime,
          lastPageCount + data.pageNumber,
          reportName,
        );

        const filterBody = this.getFilterTableBody(input);

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

  private calculateCOGS(totalQuantity: number, unitCost: number) {
    return totalQuantity * unitCost;
  }

  private calculateGrossMargin(totalSalesAmt: number, cogs: number) {
    return totalSalesAmt - cogs;
  }

  private calculatePct(grossMargin: number, totalSalesAmt: number) {
    return totalSalesAmt !== 0 ? (grossMargin / totalSalesAmt) * 100 : 0;
  }

  private getDetailsReportBody(orders: SubOrderControlListDto[]) {
    const groupedOrders = orders.reduce(
      (orderProductWise, order) => {
        const key = `${order.orderNumber}-${order.productCode}`;
        const existingOrderProduct = orderProductWise[key];

        if (existingOrderProduct) {
          existingOrderProduct.totalUnitPrice += order.totalUnitPrice;
          existingOrderProduct.totalQuantity += order.totalQuantity;
          existingOrderProduct.unitPrice = order.unitPrice;
          existingOrderProduct.unitCost = order.unitCost;
          existingOrderProduct.cogs = this.calculateCOGS(
            existingOrderProduct.totalQuantity,
            existingOrderProduct.unitCost,
          );
          existingOrderProduct.grossMargin = this.calculateGrossMargin(
            existingOrderProduct.totalUnitPrice,
            existingOrderProduct.cogs,
          );
          existingOrderProduct.ptc = this.calculatePct(
            existingOrderProduct.grossMargin,
            existingOrderProduct.totalUnitPrice,
          );
        } else {
          orderProductWise[key] = {
            ...order,
            totalUnitPrice: order.totalUnitPrice,
            totalQuantity: order.totalQuantity,
            unitPrice: order.unitPrice,
            unitCost: order.unitCost,
            cogs: this.calculateCOGS(order.totalQuantity, order.unitCost),
            grossMargin: this.calculateGrossMargin(order.totalUnitPrice, order.cogs),
            ptc: this.calculatePct(order.grossMargin, order.totalUnitPrice),
          };
        }

        return orderProductWise;
      },
      {} as Record<string, SubOrderControlListDto>,
    );

    let totalUnitPrice = 0;
    let totalQuantity = 0;
    let unitPrice = 0;
    let totalUnitCost = 0;
    let totalCOGS = 0;
    let totalGM = 0;
    let totalPct = 0;

    const reportBody = Object.values(groupedOrders).map(order => {
      totalUnitPrice += order.totalUnitPrice;
      totalQuantity += order.totalQuantity;
      unitPrice += order.unitPrice;
      totalUnitCost += order.unitCost;
      totalCOGS += this.calculateCOGS(totalQuantity, totalUnitCost);
      totalGM += this.calculateGrossMargin(totalUnitPrice, totalCOGS);
      totalPct += this.calculatePct(totalGM, totalUnitPrice);

      return [
        order.productCode,
        order.productDescription,
        order.totalUnitPrice.toFixed(ROUNDING_PRECISION),
        order.totalQuantity,
        order.unitPrice.toFixed(ROUNDING_PRECISION),
        order.unitCost.toFixed(ROUNDING_PRECISION),
        order.cogs.toFixed(ROUNDING_PRECISION),
        order.grossMargin.toFixed(ROUNDING_PRECISION),
        order.ptc.toFixed(1),
      ];
    });
    const productTotalText = this.localizationService.instant('::Report:Common:ProductTotal');

    reportBody.push([
      '',
      productTotalText,
      totalUnitPrice.toFixed(ROUNDING_PRECISION),
      totalQuantity,
      unitPrice.toFixed(ROUNDING_PRECISION),
      totalUnitCost.toFixed(ROUNDING_PRECISION),
      totalCOGS.toFixed(ROUNDING_PRECISION),
      totalGM.toFixed(ROUNDING_PRECISION),
      totalPct.toFixed(1),
    ]);

    return reportBody;
  }

  private getSummaryReportBody(orders: SubOrderControlListDto[]) {
    const groupedOrders = orders.reduce(
      (orderProductWise, order) => {
        const key = `${order.productTypeValueId}`;
        const existingOrderProduct = orderProductWise[key];

        if (existingOrderProduct) {
          existingOrderProduct.totalUnitPrice += order.totalUnitPrice;
          existingOrderProduct.totalQuantity += order.totalQuantity;
        } else {
          orderProductWise[key] = {
            ...order,
            totalUnitPrice: order.totalUnitPrice,
            totalQuantity: order.totalQuantity,
          };
        }

        return orderProductWise;
      },
      {} as Record<string, SubOrderControlListDto>,
    );

    let totalUnitPrice = 0;
    let totalQuantity = 0;
    const reportBody = Object.values(groupedOrders).map(order => {
      totalUnitPrice += order.totalUnitPrice;
      totalQuantity += order.totalQuantity;

      return [
        order.productTypeValueName || '',
        order.totalUnitPrice.toFixed(ROUNDING_PRECISION),
        order.totalQuantity,
      ];
    });

    const productTotalText = this.localizationService.instant('::Report:Common:ProductTotal');

    reportBody.push([productTotalText, totalUnitPrice.toFixed(ROUNDING_PRECISION), totalQuantity]);

    return reportBody;
  }

  private groupOrdersBySalesman(orders: SubOrderControlListDto[]): {
    [key: string]: SubOrderControlListDto[];
  } {
    return orders.reduce(
      (groupedOrders, order) => {
        const salesRepId = order.salesRepresentativeId ?? '';

        groupedOrders[salesRepId] = groupedOrders[salesRepId] || [];
        groupedOrders[salesRepId].push(order);
        return groupedOrders;
      },
      {} as { [key: string]: SubOrderControlListDto[] },
    );
  }

  private getFilterTableBody(input: FilterPagedAndSortedOrderControlListResultRequestDto): any[][] {
    const allSelectionText = this.localizationService.instant(
      '::Reports:OrderReport:Filter:AllSelect',
    );
    const fromDate = input.fromDate ? new Date(input.fromDate).toLocaleDateString() : '';
    const toDate = input.toDate ? new Date(input.toDate).toLocaleDateString() : '';
    const selectedDateInfoTextTemplate = this.localizationService.instant(
      '::Reports:Common:DateRange',
    );
    const selectedDateText = selectedDateInfoTextTemplate
      .replace('{0}', fromDate)
      .replace('{1}', toDate);
    const dateFilter = this.localizationService.instant('::Reports:Common:FilterDate');
    const customerFilter = this.localizationService.instant('::Reports:Common:CustomersFilter');
    const productDeptFilter = this.localizationService.instant(
      '::Reports:OrderReport:Filter:ProductDepartment',
    );
    const productTypeFilter = this.localizationService.instant(
      '::Reports:Common:Filter:ProductType',
    );
    const gmPercentageRange = this.localizationService.instant(
      '::Reports:Common:Filter:GMPercentageRange',
    );
    const salesPersonColName = this.localizationService.instant(
      '::Reports:Common:Filter:Salesperson',
    );

    const customerNames = formatFilterItem(this.selectedCustomerNames, allSelectionText);
    const productDepartmentNames = formatFilterItem(
      this.selectedProductDepartmentNames,
      allSelectionText,
    );
    const productTypeNames = formatFilterItem(this.selectedProductTypeNames, allSelectionText);
    const salespersonNames = formatFilterItem(this.selectedSalespersonNames, allSelectionText);
    const gmRange =
      this.minGMRange && this.maxGMRange
        ? `${this.minGMRange} - ${this.maxGMRange}`
        : allSelectionText;

    return [
      [dateFilter, selectedDateText, customerFilter, customerNames],
      [productTypeFilter, productTypeNames, productDeptFilter, productDepartmentNames],
      [salesPersonColName, salespersonNames, gmPercentageRange, gmRange],
    ];
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
        0: { fontStyle: 'bold', halign: 'right', minCellWidth: 30 },
        1: { halign: 'left', minCellWidth: 80 },
        2: { fontStyle: 'bold', halign: 'right', minCellWidth: 50 },
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
