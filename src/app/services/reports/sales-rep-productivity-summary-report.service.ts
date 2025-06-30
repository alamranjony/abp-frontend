import { Injectable, OnDestroy } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ToasterService } from '@abp/ng.theme.shared';
import { EmployeeWorkHourDto, InputFilterDto, ReportService } from '@proxy/reports';
import { LocalizationService } from '@abp/ng.core';
import trebucFont from 'src/assets/fonts/trebuc-normal.js';
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
export class SalesRepProductivitySummaryReportService implements OnDestroy {
  private readonly logoUrl = 'assets/images/logo/ffc-logo.jpg';
  destroy$: Subject<void> = new Subject();
  pdfSavedName: string = 'Sales_Rep_Productivity_Ranking_Report.pdf';

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
  ) {
    forkJoin([
      this.reportService.generateSalesRepProductivitySummaryPdfReport(input),
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
          this.generateSalesRepSummaryReportPdf(
            employees,
            logoBase64,
            input,
            stores,
            employeeFilters,
            orderTypes,
          );
        };
      });
  }

  private generateSalesRepSummaryReportPdf(
    employees: EmployeeWorkHourDto[],
    logoBase64: string,
    input: InputFilterDto,
    stores: string[],
    employeeFilters: string[],
    orderTypes: string[],
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

    const detailsReportBody = this.getEmployeeDetailsReportBody(employees);
    const columnHeight = stores.length > 3 || employeeFilters.length > 3 ? 75 : 70;

    autoTable(doc, {
      startY: columnHeight,
      head: [
        [
          this.localizationService.instant('::SalesRepReport:Rank'),
          this.localizationService.instant('::SalesRepReport:EmployeeName'),
          this.localizationService.instant('::SalesRepReport:HoursWorked'),
          this.localizationService.instant('::SalesRepReport:NetHrs'),
          this.localizationService.instant('::SalesRepReport:OrdersFilled'),
          this.localizationService.instant('::SalesRepReport:ValueProduced'),
          this.localizationService.instant('::SalesRepReport:Production'),
          this.localizationService.instant('::SalesRepReport:OrdersPerHr'),
          this.localizationService.instant('::SalesRepReport:ExtrasMade'),
          this.localizationService.instant('::SalesRepReport:ExtrasValue'),
          this.localizationService.instant('::SalesRepReport:PulledItems'),
          this.localizationService.instant('::SalesRepReport:PulledValue'),
        ],
      ],
      body: detailsReportBody,
      didDrawPage: data => {
        this.addPageHeader(
          doc,
          logoBase64,
          currentTime,
          data.pageNumber,
          this.localizationService.instant('::SalesRepReport:Title'),
        );
        const filterBody = this.getFilterTableBody(input, stores, employeeFilters, orderTypes);
        this.addFilterTable(doc, filterBody);
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
      },
      margin: { top: 80 },
      willDrawCell: data => {
        if (data.row.index === detailsReportBody.length - 1) {
          doc.setFontSize(11);
          doc.setTextColor(0, 0, 0);
        }
      },
    });

    doc.save(this.pdfSavedName);
  }

  private getEmployeeDetailsReportBody(employees: EmployeeWorkHourDto[]) {
    const reportBody = employees.map((employee, index) => [
      index + 1,
      employee.employeeName,
      employee.hoursWorked.toFixed(2),
      employee.netHoursDesign.toFixed(2),
      employee.ordersFilled,
      `$${employee.valueProduced.toFixed(2)}`,
      employee.productionPerHour.toFixed(2),
      employee.ordersPerHour.toFixed(2),
      employee.extrasMade,
      `$${employee.extrasValue.toFixed(2)}`,
      employee.pulledItems,
      `$${employee.pulledValue.toFixed(2)}`,
    ]);

    const grandTotal = employees.reduce(
      (total, employee) => {
        total.hoursWorked += employee.hoursWorked;
        total.netHoursDesign += employee.netHoursDesign;
        total.ordersFilled += employee.ordersFilled;
        total.valueProduced += employee.valueProduced;
        total.productionPerHour += employee.productionPerHour;
        total.ordersPerHour += employee.ordersPerHour;
        total.extrasMade += employee.extrasMade;
        total.extrasValue += employee.extrasValue;
        total.pulledItems += employee.pulledItems;
        total.pulledValue += employee.pulledValue;
        return total;
      },
      {
        hoursWorked: 0,
        netHoursDesign: 0,
        ordersFilled: 0,
        valueProduced: 0,
        productionPerHour: 0,
        ordersPerHour: 0,
        extrasMade: 0,
        extrasValue: 0,
        pulledItems: 0,
        pulledValue: 0,
      },
    );

    reportBody.push([
      '',
      this.localizationService.instant('::SalesRepReport:GrandTotal'),
      grandTotal.hoursWorked.toFixed(2),
      0,
      grandTotal.ordersFilled,
      `$${grandTotal.valueProduced.toFixed(2)}`,
      (grandTotal.valueProduced / grandTotal.hoursWorked).toFixed(2),
      grandTotal.ordersPerHour.toFixed(2),
      grandTotal.extrasMade,
      `$${grandTotal.extrasValue.toFixed(2)}`,
      grandTotal.pulledItems,
      `$${grandTotal.pulledValue.toFixed(2)}`,
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
    const pageInfoTemplate = this.localizationService.instant('::Reports:Common:PageInfo');
    const pageInfoText = pageInfoTemplate
      .replace('{0}', currentTime)
      .replace('{1}', pageNumber.toString());
    doc.text(pageInfoText, pageWidth - marginRight, 15, {
      align: 'right',
    });
  }

  private getFilterTableBody(
    input: InputFilterDto,
    stores: string[],
    employeeFilters: string[],
    orderTypes: string[],
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
        this.localizationService.instant('::Reports:Common:StoresFilter'),
        storeNames,
      ],
      [
        `${this.localizationService.instant('::Menu:Employees')}:`,
        employeeNames,
        `${this.localizationService.instant('::Customer:OrderHistory.OrderType')}:`,
        orderTypeNames,
      ],
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
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'right', minCellWidth: 40 },
        1: { halign: 'left', minCellWidth: 80 },
        2: { fontStyle: 'bold', halign: 'right', minCellWidth: 40 },
        3: { halign: 'left', minCellWidth: 80 },
      },
      headStyles: {
        font: REPORT_FONT_NAME,
        fontStyle: REPORT_FONT_TYPE,
      },
      bodyStyles: {
        font: REPORT_FONT_NAME,
        fontStyle: REPORT_FONT_TYPE,
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
