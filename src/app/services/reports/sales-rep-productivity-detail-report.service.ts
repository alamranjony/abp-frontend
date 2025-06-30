import { Injectable, OnDestroy } from '@angular/core';
import jsPDF from 'jspdf';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ToasterService } from '@abp/ng.theme.shared';
import { EmployeeWorkHourDto, InputFilterDto, ReportService } from '@proxy/reports';
import { deliveryCategoryOptions, orderTypeOptions } from '@proxy/orders';
import { paymentMethodOptions } from '@proxy/payment';
import { LocalizationService } from '@abp/ng.core';
import trebucFont from 'src/assets/fonts/trebuc-normal.js';
import autoTable from 'jspdf-autotable';
import {
  REPORT_FONT_FILE_NAME,
  REPORT_FONT_NAME,
  REPORT_FONT_TYPE,
  REPORT_HEADER_BACKGROUND_COLOR,
  REPORT_HEADER_TEXT_COLOR,
} from 'src/app/shared/constants';
import { formatInputFilterListWithOthers } from './reports-utils';

@Injectable({
  providedIn: 'root',
})
export class SalesRepProductivityDetailReportService implements OnDestroy {
  private readonly logoUrl = 'assets/images/logo/ffc-logo.jpg';
  destroy$: Subject<void> = new Subject();
  pdfSavedName: string = 'All_Emp_Productivity_Ranking_Report.pdf';
  lastPageNumber = 1;
  pageNumberArray = [];

  constructor(
    private http: HttpClient,
    private toasterService: ToasterService,
    private reportService: ReportService,
    private localizationService: LocalizationService,
  ) {}

  generateReport(
    input: InputFilterDto,
    stores: string[],
    employeeFilters: string[],
    orderTypes: string[],
    selectAmount: number,
  ) {
    forkJoin([
      this.reportService.generateSalesRepProductivityDetailPdfReport(input),
      this.http.get(this.logoUrl, { responseType: 'blob' }),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([employees, logoBlob]) => {
        if (!employees || employees.length === 0) {
          this.toasterService.warn('::CustomerProductAnalysisReport:NotFound');
          return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(logoBlob);
        reader.onloadend = () => {
          const logoBase64 = reader.result as string;
          this.generateSalesRepProductivityDetailReportPdf(
            employees,
            logoBase64,
            input,
            stores,
            employeeFilters,
            orderTypes,
            selectAmount,
          );
        };
      });
  }

  private generateSalesRepProductivityDetailReportPdf(
    employees: EmployeeWorkHourDto[],
    logoBase64: string,
    input: InputFilterDto,
    stores: string[],
    employeeFilters: string[],
    orderTypes: string[],
    selectAmount: number,
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

    this.addPageHeader(
      doc,
      logoBase64,
      currentTime,
      1,
      this.localizationService.instant('::SalesRepDetailsReport:SalesProductivity'),
    );
    const filterBody = this.getFilterTableBody(
      input,
      stores,
      employeeFilters,
      orderTypes,
      selectAmount,
    );
    this.addFilterTable(doc, filterBody);

    employees.forEach((employee, index) => {
      const employeeBody = this.getEmployeeDetailsReportBody(employee, index);
      const employeeOrderDetails = this.getEmployeeOrderDetailsReportBody(employee);
      this.designTableForEmployee(doc, employeeBody);
      this.designTableForEmployeeOrder(doc, employeeOrderDetails);
    });

    this.designTableForSummary(doc, employees);
    doc.save(this.pdfSavedName);
  }

  private updatePageNumber(doc: jsPDF, pageNumber: number): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginRight = 15;
    doc.setFontSize(10);
    if (this.pageNumberArray.includes(pageNumber)) return;
    doc.text(`Page: ${pageNumber}`, pageWidth - marginRight, 15, { align: 'right' });
    this.pageNumberArray.push(pageNumber);
  }

  private getEmployeeDetailsReportBody(employee: EmployeeWorkHourDto, index: number) {
    const reportBody = [];
    reportBody.push([
      index + 1,
      employee.employeeName,
      employee.hoursWorked.toFixed(2),
      employee.ordersFilled,
      `$${employee.valueProduced.toFixed(2)}`,
      employee.productionPerHour.toFixed(2),
      `$${parseInt(employee.ordersPerHour.toString(), 10)}`,
      employee.perHourSalesNumber.toFixed(1),
      employee.averagePerMin.toFixed(1),
      employee.totalPhoneOrder,
      employee.totalWalkingOrder,
    ]);

    return reportBody;
  }

  private getEmployeeOrderDetailsReportBody(employee: EmployeeWorkHourDto) {
    const reportBody = [];
    employee.employeeOrderDetails.map(element => {
      reportBody.push([
        element.subOrderNumber,
        this.getEnumDisplayName(orderTypeOptions, element.orderType),
        this.localizationService.instant(
          `::Enum:DeliveryCategory.${Number(element.deliveryCategory)}`,
        ),
        element.storeCode,
        this.getEnumDisplayName(paymentMethodOptions, element.paymentMethod),
        element.employeeId,
        element.recipientName ?? '-',
        '-',
        new Date(element.orderDate).toLocaleDateString(),
        element.deliveryDate ? new Date(element.deliveryDate).toLocaleDateString() : '-',
        element.postDate ? new Date(element.postDate).toLocaleDateString() : '-',
        `$${element.subTotal.toFixed(2)}`,
        `$${element.discountAmount.toFixed(2)}`,
        `$${element.deliveryFee.toFixed(2)}`,
        `$${element.relayFee.toFixed(2)}`,
        `$${element.salesTax.toFixed(2)}`,
        `$${(element.subTotal + element.deliveryFee + element.relayFee + element.salesTax - element.discountAmount).toFixed(2)}`,
      ]);
    });

    return reportBody;
  }

  private designTableForEmployee(doc: jsPDF, employeeBody: any) {
    autoTable(doc, {
      head: [
        [
          this.localizationService.instant('::SalesRepReport:Rank'),
          this.localizationService.instant('::ValueType:Parent:Employees'),
          this.localizationService.instant('::SalesRepReport:HoursWorked'),
          this.localizationService.instant('::SalesRepDetailsReport:OrdersSold'),
          this.localizationService.instant('::SalesRepDetailsReport:SalesAmount'),
          this.localizationService.instant('::SalesRepDetailsReport:AverageSale'),
          this.localizationService.instant('::SalesRepDetailsReport:SalesPerHour'),
          this.localizationService.instant('::SalesRepDetailsReport:NoPerHour'),
          this.localizationService.instant('::SalesRepDetailsReport:AvgPerMin'),
          this.localizationService.instant('::SalesRepDetailsReport:NoOfPhone'),
          this.localizationService.instant('::SalesRepDetailsReport:NoOfWalking'),
        ],
      ],
      headStyles: {
        font: REPORT_FONT_NAME,
        fontStyle: REPORT_FONT_TYPE,
        fillColor: REPORT_HEADER_BACKGROUND_COLOR,
        textColor: REPORT_HEADER_TEXT_COLOR,
      },
      columnStyles: {
        0: { cellWidth: 17 },
        1: { cellWidth: 20 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
        6: { cellWidth: 25 },
        7: { cellWidth: 25 },
        8: { cellWidth: 30 },
        9: { cellWidth: 30 },
        10: { cellWidth: 30 },
      },
      bodyStyles: {
        font: REPORT_FONT_NAME,
        fontStyle: REPORT_FONT_TYPE,
      },
      didDrawPage: data => {
        this.updatePageNumber(doc, data.pageNumber);
      },
      body: employeeBody,
      margin: { top: 30, left: (doc.internal.pageSize.width - 282) / 2 },
    });
  }

  private designTableForEmployeeOrder(doc: jsPDF, employeeOrderDetails: any) {
    autoTable(doc, {
      head: [
        [
          this.localizationService.instant('::SalesRepDetailsReport:OrderNo'),
          this.localizationService.instant('::SalesRepDetailsReport:TransType'),
          this.localizationService.instant('::SalesRepDetailsReport:DelvMeth'),
          this.localizationService.instant('::SalesRepDetailsReport:LocPos'),
          this.localizationService.instant('::SalesRepDetailsReport:TendType'),
          this.localizationService.instant('::SalesRepDetailsReport:SalesRep'),
          this.localizationService.instant('::SalesRepDetailsReport:Recipient'),
          this.localizationService.instant('::SalesRepDetailsReport:SoldPhone'),
          this.localizationService.instant('::SalesRepDetailsReport:OrderDate'),
          this.localizationService.instant('::SalesRepDetailsReport:DelvDate'),
          this.localizationService.instant('::SalesRepDetailsReport:PostDate'),
          this.localizationService.instant('::SalesRepDetailsReport:MdSeAmount'),
          this.localizationService.instant('::SalesRepDetailsReport:DiscAmount'),
          this.localizationService.instant('::SalesRepDetailsReport:DelvCharge'),
          this.localizationService.instant('::SalesRepDetailsReport:SvcCharge'),
          this.localizationService.instant('::SalesRepDetailsReport:SalesTax'),
          this.localizationService.instant('::SalesRepDetailsReport:Total'),
        ],
      ],
      body: employeeOrderDetails,
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 12 },
        2: { cellWidth: 18 },
        3: { cellWidth: 10 },
        4: { cellWidth: 18 },
        5: { cellWidth: 18 },
        6: { cellWidth: 18 },
        7: { cellWidth: 15 },
        8: { cellWidth: 20 },
        9: { cellWidth: 20 },
        10: { cellWidth: 20 },
        11: { cellWidth: 17 },
        12: { cellWidth: 17 },
        13: { cellWidth: 17 },
        14: { cellWidth: 17 },
        15: { cellWidth: 17 },
        16: { cellWidth: 18 },
      },
      headStyles: {
        font: REPORT_FONT_NAME,
        fontStyle: REPORT_FONT_TYPE,
        fillColor: REPORT_HEADER_BACKGROUND_COLOR,
        textColor: REPORT_HEADER_TEXT_COLOR,
      },
      bodyStyles: {
        font: REPORT_FONT_NAME,
        fontStyle: REPORT_FONT_TYPE,
        fontSize: 10,
      },
      didDrawPage: data => {
        if (data.pageNumber != 1) this.lastPageNumber = data.pageNumber + 1;
        this.updatePageNumber(doc, data.pageNumber);
      },
      margin: { top: 30, left: (doc.internal.pageSize.width - 282) / 2 },
    });
  }

  private designTableForSummary(doc: jsPDF, employees: EmployeeWorkHourDto[]) {
    const employeeWorkHourSummary = this.getEmployeeWorkSummaryReportBody(employees);
    autoTable(doc, {
      head: [
        [
          '',
          '',
          this.localizationService.instant('::SalesRepReport:HoursWorked'),
          this.localizationService.instant('::SalesRepDetailsReport:OrdersSold'),
          this.localizationService.instant('::SalesRepDetailsReport:SalesAmount'),
          this.localizationService.instant('::SalesRepDetailsReport:AverageSale'),
          this.localizationService.instant('::SalesRepDetailsReport:SalesPerHour'),
          this.localizationService.instant('::SalesRepDetailsReport:NoPerHour'),
          this.localizationService.instant('::SalesRepDetailsReport:AvgPerMin'),
          this.localizationService.instant('::SalesRepDetailsReport:NoOfPhone'),
          this.localizationService.instant('::SalesRepDetailsReport:NoOfWalking'),
        ],
      ],
      body: employeeWorkHourSummary,
      headStyles: {
        font: REPORT_FONT_NAME,
        fontStyle: REPORT_FONT_TYPE,
        fillColor: REPORT_HEADER_BACKGROUND_COLOR,
        textColor: REPORT_HEADER_TEXT_COLOR,
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 7 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
        6: { cellWidth: 25 },
        7: { cellWidth: 25 },
        8: { cellWidth: 30 },
        9: { cellWidth: 30 },
        10: { cellWidth: 30 },
      },
      bodyStyles: {
        font: REPORT_FONT_NAME,
        fontSize: 11,
      },
      didDrawPage: () => {
        this.updatePageNumber(doc, this.lastPageNumber);
      },
      willDrawCell: data => {
        if (data.row.section === 'body') doc.setTextColor(0, 0, 0);
      },
      margin: { top: 30, left: (doc.internal.pageSize.width - 282) / 2 },
    });
  }

  private getEmployeeWorkSummaryReportBody(employees: EmployeeWorkHourDto[]) {
    const reportBody = [];
    const grandTotal = employees.reduce(
      (total, employee) => {
        total.hoursWorked += employee.hoursWorked;
        total.ordersFilled += employee.ordersFilled;
        total.valueProduced += employee.valueProduced;
        total.productionPerHour += employee.productionPerHour;
        total.ordersPerHour += parseInt(employee.ordersPerHour.toString(), 10);
        total.perHourSalesNumber += employee.perHourSalesNumber;
        total.averagePerMin += employee.averagePerMin;
        total.totalPhoneOrder += employee.totalPhoneOrder;
        total.totalWalkingOrder += employee.totalWalkingOrder;
        return total;
      },
      {
        hoursWorked: 0,
        ordersFilled: 0,
        valueProduced: 0,
        productionPerHour: 0,
        ordersPerHour: 0,
        perHourSalesNumber: 0,
        averagePerMin: 0,
        totalPhoneOrder: 0,
        totalWalkingOrder: 0,
      },
    );

    reportBody.push([
      this.localizationService.instant('::SalesRepReport:GrandTotal'),
      '',
      grandTotal.hoursWorked.toFixed(2),
      grandTotal.ordersFilled,
      `$${grandTotal.valueProduced.toFixed(2)}`,
      (grandTotal.valueProduced / grandTotal.ordersFilled).toFixed(2),
      `$${(grandTotal.ordersFilled / grandTotal.hoursWorked).toFixed(0)}`,
      grandTotal.perHourSalesNumber.toFixed(1),
      grandTotal.averagePerMin.toFixed(1),
      grandTotal.totalPhoneOrder,
      grandTotal.totalWalkingOrder,
    ]);

    return reportBody;
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
    doc.text(`Curr. Time: ${currentTime}  Page: ${pageNumber}`, pageWidth - marginRight, 15, {
      align: 'right',
    });
  }

  private getFilterTableBody(
    input: InputFilterDto,
    stores: string[],
    employeeFilters: string[],
    orderTypes: string[],
    selectAmount: number,
  ): any[][] {
    const allSelectionText = this.localizationService.instant(
      '::Reports:OrderReport:Filter:AllSelect',
    );
    const fromDate = input.fromDate ? new Date(input.fromDate).toLocaleDateString() : '';
    const toDate = input.toDate ? new Date(input.toDate).toLocaleDateString() : '';
    const selectedDateInfo = fromDate && toDate ? `${fromDate} To ${toDate}` : '';
    const storeNames =
      stores.length > 0 ? formatInputFilterListWithOthers(stores) : allSelectionText;
    const employeeNames =
      employeeFilters.length > 0
        ? formatInputFilterListWithOthers(employeeFilters)
        : allSelectionText;
    const orderTypeNames =
      orderTypes.length > 0 ? formatInputFilterListWithOthers(orderTypes) : allSelectionText;

    return [
      [
        this.localizationService.instant('::Reports:Common:FilterDate'),
        selectedDateInfo,
        `${this.localizationService.instant('::Menu:Employees')}:`,
        employeeNames,
      ],
      [
        this.localizationService.instant('::Reports:Common:StoresFilter'),
        storeNames,
        this.localizationService.instant('::SalesVarianceBySalesRepReport:TotalMdse') + ':',
        selectAmount,
      ],
      [`${this.localizationService.instant('::Customer:OrderHistory.OrderType')}:`, orderTypeNames],
    ];
  }

  private addFilterTable(doc: jsPDF, filterBody: any[][]): void {
    autoTable(doc, {
      body: filterBody,
      startY: 50,
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

  private getEnumDisplayName(enumOptions: any[], enumValue: number): string {
    const option = enumOptions.find(option => option.value === enumValue);
    return option ? option.key : 'Unknown';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
