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
export class TimeCardSummaryReportService implements OnDestroy {
  private readonly logoUrl = 'assets/images/logo/ffc-logo.jpg';
  destroy$: Subject<void> = new Subject();
  pdfSavedName: string = 'Time Card Summary.pdf';

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
    departments: string[],
  ) {
    forkJoin([
      this.reportService.generateTimeCardSummaryPdfReport(input),
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
          this.generateTimeCardSummaryReportPdf(
            employees,
            logoBase64,
            input,
            stores,
            employeeFilters,
            departments,
          );
        };
      });
  }

  private generateTimeCardSummaryReportPdf(
    employees: EmployeeWorkHourDto[],
    logoBase64: string,
    input: InputFilterDto,
    stores: string[],
    employeeFilters: string[],
    departments: string[],
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
    const totalHours = employees.reduce(
      (total, employeeWorkHour) => total + employeeWorkHour.hoursWorked,
      0,
    );
    const columnHeight =
      stores.length > 3 || employeeFilters.length > 3 || departments.length > 3 ? 75 : 70;

    autoTable(doc, {
      startY: columnHeight,
      head: [
        [
          this.localizationService.instant('::TimeCardReport:Code'),
          this.localizationService.instant('::SalesRepReport:EmployeeName'),
          this.localizationService.instant('::TimeCardReport:Location'),
          this.localizationService.instant('::TimeCardReport:Dept'),
          this.localizationService.instant('::SalesRepReport:HoursWorked'),
          this.localizationService.instant('::TimeCardReport:AccumulatedHours'),
        ],
      ],
      body: detailsReportBody,
      didDrawPage: data => {
        this.addPageHeader(
          doc,
          logoBase64,
          currentTime,
          data.pageNumber,
          this.localizationService.instant('::Menu:TimeCardSummary'),
        );
        const filterBody = this.getFilterTableBody(input, stores, employeeFilters, departments);
        this.addFilterTable(doc, filterBody);
      },
      headStyles: {
        font: REPORT_FONT_NAME,
        fontStyle: REPORT_FONT_TYPE,
        halign: 'center',
        fillColor: REPORT_HEADER_BACKGROUND_COLOR,
        textColor: REPORT_HEADER_TEXT_COLOR,
      },
      bodyStyles: {
        font: REPORT_FONT_NAME,
        fontStyle: REPORT_FONT_TYPE,
        halign: 'center',
      },
      margin: { top: 75 },
    });

    this.addGrandTotalWorkHours(doc, totalHours);
    doc.save(this.pdfSavedName);
  }

  private addGrandTotalWorkHours(
    doc: jsPDF,
    totalWorkHours: number,
    columnName: string = this.localizationService.instant('::SalesRepReport:GrandTotalHrs'),
  ): void {
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      body: [
        [
          {
            content: columnName + totalWorkHours.toFixed(2),
            colSpan: 10,
            styles: { halign: 'center', fontStyle: 'bold' },
          },
        ],
      ],
      headStyles: {
        font: REPORT_FONT_NAME,
        fontStyle: REPORT_FONT_TYPE,
      },
      bodyStyles: {
        font: REPORT_FONT_NAME,
        fontStyle: REPORT_FONT_TYPE,
      },
      theme: 'plain',
      styles: { fontSize: 12, cellPadding: 4 },
    });
  }

  private getEmployeeDetailsReportBody(employees: EmployeeWorkHourDto[]) {
    const reportBody = [];

    employees.forEach((employee, index) => {
      reportBody.push([
        employee.employeeId,
        employee.employeeName,
        employee.location,
        employee.department,
        employee.hoursWorked.toFixed(2),
        employee.accumulatedHoursWorked.toFixed(2),
      ]);

      if (
        index < employees.length - 1 &&
        (employees[index + 1].employeeId !== employee.employeeId ||
          employees[index + 1].location !== employee.location)
      ) {
        reportBody.push(['', '', '', '', '', '']);
      }
    });

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
    departments: string[],
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
    const departmentNames =
      departments.length > 0 ? formatInputFilterListWithOthers(departments) : allSelectionText;

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
        `${this.localizationService.instant('::Employee.Fields.Department')}:`,
        departmentNames,
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
