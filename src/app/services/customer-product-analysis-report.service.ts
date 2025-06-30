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
import trebucFont from 'src/assets/fonts/trebuc-normal.js';
import { formatFilterItem } from './reports/reports-utils';

@Injectable({
  providedIn: 'root',
})
export class CustomerProductAnalysisReportService implements OnDestroy {
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
    tableStartY: 95,
  };
  selectedSalespersonNames: string[] = [];
  selectedCustomerNames: string[] = [];
  selectedStoreNames: string[] = [];
  selectedProductNames: string[] = [];
  selectedProductDepartmentNames: string[] = [];
  selectedProductTypeNames: string[] = [];
  isIncludePrice: boolean;
  reportTitle: string;
  destroy$: Subject<void> = new Subject();

  constructor(
    private http: HttpClient,
    private toasterService: ToasterService,
    private orderService: OrderService,
    private localizationService: LocalizationService,
  ) {}

  generateReport(
    input: FilterPagedAndSortedOrderControlListResultRequestDto,
    customers: string[],
    stores: string[],
    productTypeNames: string[],
    productDeptNames: string[],
    productNames: string[],
    salesPersonNames: string[],
    reportTitle: string,
    isIncludePrice: boolean,
  ) {
    this.selectedCustomerNames = customers;
    this.selectedStoreNames = stores;
    this.selectedProductTypeNames = productTypeNames;
    this.selectedProductDepartmentNames = productDeptNames;
    this.selectedProductNames = productNames;
    this.selectedSalespersonNames = salesPersonNames;
    this.reportTitle = reportTitle;
    this.isIncludePrice = isIncludePrice;

    forkJoin([
      this.orderService.generateCustomerProductAnalysisReport(input),
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
          this.generateCustomerProductAnalysisReportPdf(orders, logoBase64, input);
        };
      });
  }

  private generateCustomerProductAnalysisReportPdf(
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

    const customerOrderEntries = Object.entries(this.groupOrdersByCustomers(orders));
    const totalEntries = customerOrderEntries.length;

    let locationTotal = {
      totalQuantity: 0,
      totalUnitPrice: 0,
    };

    customerOrderEntries.forEach(([customer, customerOrders], index) => {
      const reportBody = this.getReportBody(customerOrders);

      this.calculateLocationTotals(reportBody, locationTotal);

      if (index === totalEntries - 1) {
        this.addLocationTotals(locationTotal, reportBody);
      }

      this.addReportContents(doc, reportBody, logoBase64, currentTime, input, customer, index);

      if (index < customerOrderEntries.length - 1) {
        doc.addPage();
      }
    });

    const fileName = this.localizationService.instant(
      '::Reports:CustomerProductAnalysis:DownloadableFileName',
    );
    doc.save(this.reportTitle || fileName);
  }

  private addLocationTotals(
    locationTotal: { totalQuantity: number; totalUnitPrice: number },
    reportBody: (string | number)[][],
  ) {
    const locationTotalLabel = this.localizationService.instant(
      '::Reports:CustomerProductAnalysis:LocationTotal',
    );

    const locationTotalRow = [
      '',
      locationTotalLabel,
      locationTotal.totalQuantity,
      locationTotal.totalUnitPrice.toFixed(ROUNDING_PRECISION),
      (locationTotal.totalQuantity
        ? locationTotal.totalUnitPrice / locationTotal.totalQuantity
        : 0
      ).toFixed(ROUNDING_PRECISION),
      '',
    ];

    reportBody.push(locationTotalRow);
  }

  private calculateLocationTotals(
    reportBody: (string | number)[][],
    locationTotal: { totalQuantity: number; totalUnitPrice: number },
  ) {
    reportBody.forEach(row => {
      locationTotal.totalQuantity += parseFloat(row[2] as string);
      locationTotal.totalUnitPrice += parseFloat(row[3] as string);
    });
  }

  private addReportContents(
    doc: jsPDF,
    body: (string | number)[][],
    logoBase64: string,
    currentTime: string,
    input: FilterPagedAndSortedOrderControlListResultRequestDto,
    customer: string,
    index: number,
  ) {
    const formattedBody = body.map(row => {
      return [
        row[0],
        row[1],
        row[2],
        this.isIncludePrice ? `$${row[3]}` : '***',
        this.isIncludePrice ? `$${row[4]}` : '***',
        row[5],
      ];
    });

    const lastPageCount = index > 0 ? doc.getNumberOfPages() - 1 : 0;

    const emptyCustomer = this.localizationService.instant('::Reports:Filters:EmptyCustomer');

    doc.setFontSize(14);
    doc.text(customer || emptyCustomer, 14, this.reportConfig.tableStartY - 5);

    const productCodeColumnName = this.localizationService.instant(
      '::Reports:CustomerProductAnalysis:ProductCode',
    );
    const productDescriptionColumnName = this.localizationService.instant(
      '::Reports:CustomerProductAnalysis:ProductDescription',
    );
    const totalUnitsColumnName = this.localizationService.instant(
      '::Reports:CustomerProductAnalysis:TotalUnits',
    );
    const totalAmountColumnName = this.localizationService.instant(
      '::Reports:CustomerProductAnalysis:TotalAmount',
    );
    const avgUnitPriceColumnName = this.localizationService.instant(
      '::Reports:CustomerProductAnalysis:AvgUnitPrice',
    );
    const unitsOfOrderColumnName = this.localizationService.instant(
      '::Reports:CustomerProductAnalysis:UnitsOfOrder',
    );
    const reportName = this.localizationService.instant(
      '::Reports:CustomerProductAnalysis:ReportName',
    );

    autoTable(doc, {
      startY: this.reportConfig.tableStartY,
      head: [
        [
          productCodeColumnName,
          productDescriptionColumnName,
          totalUnitsColumnName,
          totalAmountColumnName,
          avgUnitPriceColumnName,
          unitsOfOrderColumnName,
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
    const groupedOrders = orders.reduce(
      (productWiseOrder, order) => {
        const existingProduct = productWiseOrder[order.productCode];
        if (existingProduct) {
          existingProduct.totalQuantity += order.quantity;
          existingProduct.totalUnitPrice += order.amount;
        } else {
          productWiseOrder[order.productCode] = {
            ...order,
            totalQuantity: order.quantity,
            totalUnitPrice: order.amount,
          };
        }
        return productWiseOrder;
      },
      {} as Record<string, SubOrderControlListDto>,
    );

    return Object.values(groupedOrders).map(order => [
      order.productCode,
      order.productDescription,
      order.totalQuantity,
      order.totalUnitPrice.toFixed(ROUNDING_PRECISION),
      (order.totalQuantity ? order.totalUnitPrice / order.totalQuantity : 0).toFixed(
        ROUNDING_PRECISION,
      ),
      '__________',
    ]);
  }

  private groupOrdersByCustomers(orders: SubOrderControlListDto[]): {
    [key: string]: SubOrderControlListDto[];
  } {
    return orders.reduce(
      (groupedOrders, order) => {
        const customerId = order.customerId ?? '';
        const customerName = order.customerName || '';
        const key = customerId || customerName ? `${customerId} : ${customerName}` : '';

        groupedOrders[key] = groupedOrders[key] || [];
        groupedOrders[key].push(order);
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
    const storeFilter = this.localizationService.instant('::Reports:Common:StoresFilter');
    const customerFilter = this.localizationService.instant('::Reports:Common:CustomersFilter');
    const productFilter = this.localizationService.instant(
      '::Reports:ProductSalesByDeliveryType:Filter:Product',
    );
    const productDeptFilter = this.localizationService.instant(
      '::Reports:OrderReport:Filter:ProductDepartment',
    );
    const productTypeFilter = this.localizationService.instant(
      '::Reports:Common:Filter:ProductType',
    );
    const salesPersonFilter = this.localizationService.instant(
      '::Reports:Common:Filter:Salesperson',
    );

    const customerNames = formatFilterItem(this.selectedCustomerNames, allSelectionText);
    const storeNames = formatFilterItem(this.selectedStoreNames, allSelectionText);
    const productNames = formatFilterItem(this.selectedProductNames, allSelectionText);
    const productDepartmentNames = formatFilterItem(
      this.selectedProductDepartmentNames,
      allSelectionText,
    );
    const productTypeNames = formatFilterItem(this.selectedProductTypeNames, allSelectionText);
    const salespersonNames = formatFilterItem(this.selectedSalespersonNames, allSelectionText);

    return [
      [dateFilter, selectedDateText, customerFilter, customerNames],
      [storeFilter, storeNames, salesPersonFilter, salespersonNames],
      [productTypeFilter, productTypeNames, productDeptFilter, productDepartmentNames],
      [productFilter, productNames],
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
