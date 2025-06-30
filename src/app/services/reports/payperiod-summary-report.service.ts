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
import { PayrollFrequency } from '@proxy/employees';

type StoreTotal = {
  totalDaysWorked: number;
  week1WorkedHour: number;
  week1OverTime: number;
  week2WorkedHour: number;
  week2OverTime: number;
  month1WorkedHour: number;
  month1OverTime: number;
  month2WorkedHour: number;
  month2OverTime: number;
};

@Injectable({
  providedIn: 'root',
})
export class PayPeriodSummaryReportService implements OnDestroy {
  private readonly logoUrl = 'assets/images/logo/ffc-logo.jpg';
  destroy$: Subject<void> = new Subject();
  pdfSavedName = 'Pay Period Summary';
  holidayvalues = '.00';
  pageNumber = 1;

  constructor(
    private http: HttpClient,
    private toasterService: ToasterService,
    private reportService: ReportService,
    private localizationService: LocalizationService,
  ) {}

  generateReport(
    input: InputFilterDto,
    stores: string[],
    departments: string[],
    payrollFrequency: PayrollFrequency,
  ) {
    forkJoin([
      this.reportService.generatePayPeriodSummaryPdfReport(input),
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
          this.generatePayPeriodSummaryReportPdf(
            employees,
            logoBase64,
            stores,
            departments,
            payrollFrequency,
            input,
          );
        };
      });
  }

  private generatePayPeriodSummaryReportPdf(
    employees: EmployeeWorkHourDto[],
    logoBase64: string,
    stores: string[],
    departments: string[],
    payrollFrequency: PayrollFrequency,
    input: InputFilterDto,
  ): void {
    const doc = new jsPDF({ orientation: 'landscape' });

    doc.addFileToVFS(REPORT_FONT_FILE_NAME, trebucFont);
    doc.addFont(REPORT_FONT_FILE_NAME, REPORT_FONT_NAME, REPORT_FONT_TYPE);
    doc.setFont(REPORT_FONT_NAME, REPORT_FONT_TYPE);

    const groupedByLocation = this.groupBy(employees, 'location');
    let grandTotals = this.initializeGrandTotals();

    Object.keys(groupedByLocation).forEach((location, index, array) => {
      const groupedByDepartment = this.groupBy(groupedByLocation[location], 'department');
      let storeTotals = this.initializeStoreTotals();

      Object.keys(groupedByDepartment).forEach((department, deptIndex, deptArray) => {
        this.addPageHeaderAndFilters(
          doc,
          logoBase64,
          stores,
          departments,
          input,
          this.pageNumber++,
        );
        doc.text(
          `${this.localizationService.instant('::Employee.Fields.Department')}: ${department}, ${this.localizationService.instant('::Employee.Fields.Location')}: ${location}`,
          15,
          75,
        );

        const departmentBody = this.getReportBodyByPayrollFrequency(
          groupedByDepartment,
          department,
          payrollFrequency,
        );

        if (departmentBody.length > 0) {
          this.accumulateStoreTotals(storeTotals, departmentBody, payrollFrequency);
        }

        this.addTableForDepartment(doc, payrollFrequency, departmentBody);

        if (deptIndex !== deptArray.length - 1) {
          doc.addPage();
        }
      });

      doc.addPage();
      this.addPageHeaderAndFilters(doc, logoBase64, stores, departments, input, this.pageNumber++);
      const storeTotalRow = this.calculateStoreTotalRow(storeTotals, payrollFrequency);
      this.addTableForStoreGrandTotal(doc, payrollFrequency, storeTotalRow);
      this.accumulateGrandTotals(grandTotals, storeTotals);

      if (index !== array.length - 1) doc.addPage();
    });

    doc.addPage();
    this.addPageHeaderAndFilters(doc, logoBase64, stores, departments, input, this.pageNumber++);
    const grandTotalRow = this.calculateGrandTotalRow(grandTotals, payrollFrequency);
    this.addTableForStoreGrandTotal(doc, payrollFrequency, grandTotalRow);

    doc.save(this.pdfSavedName);
  }

  addTableForDepartment(
    doc: jsPDF,
    payrollFrequency: PayrollFrequency,
    departmentBody: string[][],
  ) {
    autoTable(doc, {
      startY: 78,
      head: [this.getHeaderListByPayrollFrequency(payrollFrequency)],
      body: departmentBody,
      headStyles: {
        font: REPORT_FONT_NAME,
        fontStyle: REPORT_FONT_TYPE,
        fillColor: REPORT_HEADER_BACKGROUND_COLOR,
        textColor: REPORT_HEADER_TEXT_COLOR,
      },
      columnStyles: {
        0: { cellWidth: 40 },
      },
      bodyStyles: {
        font: REPORT_FONT_NAME,
        fontStyle: REPORT_FONT_TYPE,
      },
      margin: { top: 40 },
    });
  }

  addTableForStoreGrandTotal(
    doc: jsPDF,
    payrollFrequency: PayrollFrequency,
    storeGrandTotalRow: string[],
  ) {
    autoTable(doc, {
      startY: 70,
      head: [this.getHeaderListByPayrollFrequency(payrollFrequency, true)],
      body: [storeGrandTotalRow],
      columnStyles: {
        0: { cellWidth: 40 },
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
      margin: { top: 40 },
    });
  }

  private addPageHeaderAndFilters(
    doc: jsPDF,
    logoBase64: string,
    stores: string[],
    departments: string[],
    input: InputFilterDto,
    pageNumber: number,
  ) {
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
      pageNumber,
      this.localizationService.instant('::Report:PayPeriodSummary.Title'),
    );

    const filterBody = this.getFilterTableBody(input, stores, departments);
    this.addFilterTable(doc, filterBody);
  }

  private initializeStoreTotals(): StoreTotal {
    return {
      totalDaysWorked: 0,
      week1WorkedHour: 0,
      week1OverTime: 0,
      week2WorkedHour: 0,
      week2OverTime: 0,
      month1WorkedHour: 0,
      month1OverTime: 0,
      month2WorkedHour: 0,
      month2OverTime: 0,
    };
  }

  private initializeGrandTotals(): StoreTotal {
    return this.initializeStoreTotals();
  }

  private accumulateStoreTotals(
    storeTotals: StoreTotal,
    departmentBody: string[][],
    payrollFrequency: PayrollFrequency,
  ): void {
    const deptTotals = departmentBody[departmentBody.length - 1];

    storeTotals.totalDaysWorked += parseFloat(deptTotals[2]);

    switch (payrollFrequency) {
      case PayrollFrequency.Weekly:
        storeTotals.week1WorkedHour += parseFloat(deptTotals[3]);
        storeTotals.week1OverTime += parseFloat(deptTotals[4]);
        break;
      case PayrollFrequency.BiWeekly:
        storeTotals.week1WorkedHour += parseFloat(deptTotals[3]);
        storeTotals.week1OverTime += parseFloat(deptTotals[4]);
        storeTotals.week2WorkedHour += parseFloat(deptTotals[6]);
        storeTotals.week2OverTime += parseFloat(deptTotals[7]);
        break;
      case PayrollFrequency.Monthly:
        storeTotals.month1WorkedHour += parseFloat(deptTotals[3]);
        storeTotals.month1OverTime += parseFloat(deptTotals[4]);
        break;
      case PayrollFrequency.BiMonthly:
        storeTotals.month1WorkedHour += parseFloat(deptTotals[3]);
        storeTotals.month1OverTime += parseFloat(deptTotals[4]);
        storeTotals.month2WorkedHour += parseFloat(deptTotals[6]);
        storeTotals.month2OverTime += parseFloat(deptTotals[7]);
        break;
    }
  }

  private calculateStoreTotalRow(
    storeTotals: StoreTotal,
    payrollFrequency: PayrollFrequency,
  ): string[] {
    let storeGrandTotalWorked = 0;
    let storeRowData: string[] = [];
    switch (payrollFrequency) {
      case PayrollFrequency.Weekly:
        storeGrandTotalWorked = storeTotals.week1WorkedHour + storeTotals.week1OverTime;
        storeRowData = [
          storeTotals.week1WorkedHour.toFixed(2),
          storeTotals.week1OverTime.toFixed(2),
          storeGrandTotalWorked.toFixed(2),
          storeGrandTotalWorked.toFixed(2),
        ];
        break;

      case PayrollFrequency.BiWeekly:
        storeGrandTotalWorked =
          storeTotals.week1WorkedHour +
          storeTotals.week2WorkedHour +
          storeTotals.week1OverTime +
          storeTotals.week2OverTime;
        storeRowData = [
          storeTotals.week1WorkedHour.toFixed(2),
          storeTotals.week1OverTime.toFixed(2),
          (storeTotals.week1WorkedHour + storeTotals.week1OverTime).toFixed(2),
          storeTotals.week2WorkedHour.toFixed(2),
          storeTotals.week2OverTime.toFixed(2),
          (storeTotals.week2WorkedHour + storeTotals.week2OverTime).toFixed(2),
          storeGrandTotalWorked.toFixed(2),
        ];
        break;

      case PayrollFrequency.Monthly:
        storeGrandTotalWorked = storeTotals.month1WorkedHour + storeTotals.month1OverTime;
        storeRowData = [
          storeTotals.month1WorkedHour.toFixed(2),
          storeTotals.month1OverTime.toFixed(2),
          storeGrandTotalWorked.toFixed(2),
          storeGrandTotalWorked.toFixed(2),
        ];
        break;

      case PayrollFrequency.BiMonthly:
        storeGrandTotalWorked =
          storeTotals.month1WorkedHour +
          storeTotals.month1OverTime +
          storeTotals.month2WorkedHour +
          storeTotals.month2OverTime;
        storeRowData = [
          storeTotals.month1WorkedHour.toFixed(2),
          storeTotals.month1OverTime.toFixed(2),
          (storeTotals.month1WorkedHour + storeTotals.month1OverTime).toFixed(2),
          storeTotals.month2WorkedHour.toFixed(2),
          storeTotals.month2OverTime.toFixed(2),
          (storeTotals.month2WorkedHour + storeTotals.month2OverTime).toFixed(2),
          storeGrandTotalWorked.toFixed(2),
        ];
        break;
    }

    return [
      this.localizationService.instant('::Report:PayPeriod.StoreTotal'),
      '',
      storeTotals.totalDaysWorked.toFixed(2),
      ...storeRowData,
      this.holidayvalues,
      this.holidayvalues,
      this.holidayvalues,
      this.holidayvalues,
      storeGrandTotalWorked.toFixed(2),
      (storeGrandTotalWorked / storeTotals.totalDaysWorked).toFixed(2),
    ];
  }

  private accumulateGrandTotals(grandTotals: StoreTotal, storeTotals: StoreTotal): void {
    grandTotals.totalDaysWorked += storeTotals.totalDaysWorked;
    grandTotals.week1WorkedHour += storeTotals.week1WorkedHour;
    grandTotals.week1OverTime += storeTotals.week1OverTime;
    grandTotals.week2WorkedHour += storeTotals.week2WorkedHour;
    grandTotals.week2OverTime += storeTotals.week2OverTime;
    grandTotals.month1WorkedHour += storeTotals.month1WorkedHour;
    grandTotals.month1OverTime += storeTotals.month1OverTime;
    grandTotals.month2WorkedHour += storeTotals.month2WorkedHour;
    grandTotals.month2OverTime += storeTotals.month2OverTime;
  }

  private calculateGrandTotalRow(
    grandTotals: StoreTotal,
    payrollFrequency: PayrollFrequency,
  ): string[] {
    let grandTotalWorked = 0;
    let grandTotalRowData: string[] = [];

    switch (payrollFrequency) {
      case PayrollFrequency.Weekly:
        grandTotalWorked = grandTotals.week1WorkedHour + grandTotals.week1OverTime;
        grandTotalRowData = [
          grandTotals.week1WorkedHour.toFixed(2),
          grandTotals.week1OverTime.toFixed(2),
          grandTotalWorked.toFixed(2),
          grandTotalWorked.toFixed(2),
        ];
        break;

      case PayrollFrequency.BiWeekly:
        grandTotalWorked =
          grandTotals.week1WorkedHour +
          grandTotals.week2WorkedHour +
          grandTotals.week1OverTime +
          grandTotals.week2OverTime;
        grandTotalRowData = [
          grandTotals.week1WorkedHour.toFixed(2),
          grandTotals.week1OverTime.toFixed(2),
          (grandTotals.week1WorkedHour + grandTotals.week1OverTime).toFixed(2),
          grandTotals.week2WorkedHour.toFixed(2),
          grandTotals.week2OverTime.toFixed(2),
          (grandTotals.week2WorkedHour + grandTotals.week2OverTime).toFixed(2),
          grandTotalWorked.toFixed(2),
        ];
        break;

      case PayrollFrequency.Monthly:
        grandTotalWorked = grandTotals.month1WorkedHour + grandTotals.month1OverTime;
        grandTotalRowData = [
          grandTotals.month1WorkedHour.toFixed(2),
          grandTotals.month1OverTime.toFixed(2),
          grandTotalWorked.toFixed(2),
          grandTotalWorked.toFixed(2),
        ];
        break;

      case PayrollFrequency.BiMonthly:
        grandTotalWorked =
          grandTotals.month1WorkedHour +
          grandTotals.month1OverTime +
          grandTotals.month2WorkedHour +
          grandTotals.month2OverTime;
        grandTotalRowData = [
          grandTotals.month1WorkedHour.toFixed(2),
          grandTotals.month1OverTime.toFixed(2),
          (grandTotals.month1WorkedHour + grandTotals.month1OverTime).toFixed(2),
          grandTotals.month2WorkedHour.toFixed(2),
          grandTotals.month2OverTime.toFixed(2),
          (grandTotals.month2WorkedHour + grandTotals.month2OverTime).toFixed(2),
          grandTotalWorked.toFixed(2),
        ];
        break;
    }

    return [
      this.localizationService.instant('::Reports:SalesmanGrossMarginAnalysis:GrandTotal'),
      '',
      grandTotals.totalDaysWorked.toFixed(2),
      ...grandTotalRowData,
      this.holidayvalues,
      this.holidayvalues,
      this.holidayvalues,
      this.holidayvalues,
      grandTotalWorked.toFixed(2),
      (grandTotalWorked / grandTotals.totalDaysWorked).toFixed(2),
    ];
  }

  private getReportBodyByPayrollFrequency(
    departmentGroupedData: Record<string, EmployeeWorkHourDto[]>,
    department: string,
    payrollFrequency: PayrollFrequency,
  ): string[][] {
    const departmentData = departmentGroupedData[department].map(employee => {
      const holidayValues = this.holidayvalues;

      let week1Worked = employee.week1WorkedHour;
      let week1Overtime = employee.week1OverTime;
      let week2Worked = employee.week2WorkedHour;
      let week2Overtime = employee.week2OverTime;

      let month1Worked = employee.month1WorkedHour;
      let month1Overtime = employee.month1OverTime;
      let month2Worked = employee.month1WorkedHour;
      let month2Overtime = employee.month2OverTime;

      let totalWorked = 0;
      let totalWorkedHour = 0;
      let totalOvertime = 0;

      let row: string[] = [
        employee.employeeId,
        employee.employeeName,
        employee.daysWorked.toString(),
      ];

      switch (payrollFrequency) {
        case PayrollFrequency.Weekly:
          totalWorked = week1Worked + week1Overtime;
          totalWorkedHour = week1Worked;
          totalOvertime = week1Overtime;

          row.push(
            week1Worked.toFixed(2),
            week1Overtime.toFixed(2),
            totalWorked.toFixed(2),
            totalWorked.toFixed(2),
          );
          break;

        case PayrollFrequency.BiWeekly:
          totalWorked = week1Worked + week1Overtime + week2Worked + week2Overtime;
          totalWorkedHour = week1Worked + week2Worked;
          totalOvertime = week1Overtime + week2Overtime;

          row.push(
            week1Worked.toFixed(2),
            week1Overtime.toFixed(2),
            (week1Worked + week1Overtime).toFixed(2),
            week2Worked.toFixed(2),
            week2Overtime.toFixed(2),
            (week2Worked + week2Overtime).toFixed(2),
            totalWorked.toFixed(2),
          );
          break;

        case PayrollFrequency.Monthly:
          totalWorked = month1Worked + month1Overtime;
          totalWorkedHour = month1Worked;
          totalOvertime = month1Overtime;

          row.push(
            month1Worked.toFixed(2),
            month1Overtime.toFixed(2),
            totalWorked.toFixed(2),
            totalWorked.toFixed(2),
          );
          break;

        case PayrollFrequency.BiMonthly:
          totalWorked = month1Worked + month1Overtime + month2Worked + month2Overtime;
          totalWorkedHour = month1Worked + month2Worked;
          totalOvertime = month1Overtime + month2Overtime;

          row.push(
            month1Worked.toFixed(2),
            month1Overtime.toFixed(2),
            (month1Worked + month1Overtime).toFixed(2),
            month2Worked.toFixed(2),
            month2Overtime.toFixed(2),
            (month2Worked + month2Overtime).toFixed(2),
            totalWorked.toFixed(2),
          );
          break;
      }

      row.push(
        holidayValues,
        holidayValues,
        holidayValues,
        holidayValues,
        totalWorked.toFixed(2),
        (totalWorked / employee.daysWorked).toFixed(2),
        totalWorkedHour.toFixed(2),
        totalOvertime.toFixed(2),
      );

      return row;
    });

    const departmentTotalRow = this.calculateDepartmentTotalRow(
      departmentGroupedData,
      department,
      payrollFrequency,
    );
    departmentData.push(departmentTotalRow);

    return departmentData;
  }

  private calculateDepartmentTotalRow(
    departmentGroupedData: Record<string, EmployeeWorkHourDto[]>,
    department: string,
    payrollFrequency: PayrollFrequency,
  ): string[] {
    const totalDaysWorked = departmentGroupedData[department].reduce(
      (sum, emp) => sum + emp.daysWorked,
      0,
    );

    let totalWeek1WorkedHour = 0;
    let totalWeek1OverTime = 0;
    let totalWeek2WorkedHour = 0;
    let totalWeek2OverTime = 0;
    let totalMonth1WorkedHour = 0;
    let totalMonth1OverTime = 0;
    let totalMonth2WorkedHour = 0;
    let totalMonth2OverTime = 0;

    departmentGroupedData[department].forEach(emp => {
      totalWeek1WorkedHour += emp.week1WorkedHour;
      totalWeek1OverTime += emp.week1OverTime;
      totalWeek2WorkedHour += emp.week2WorkedHour;
      totalWeek2OverTime += emp.week2OverTime;
      totalMonth1WorkedHour += emp.month1WorkedHour;
      totalMonth1OverTime += emp.month1OverTime;
      totalMonth2WorkedHour += emp.month2WorkedHour;
      totalMonth2OverTime += emp.month2OverTime;
    });

    let totalWorkedHours = 0;
    let totalOvertime = 0;
    let grandTotal = 0;

    let departmentTotalRow: string[] = [
      this.localizationService.instant('::Report:PayPeriod.DeptTotal'),
      '',
      totalDaysWorked.toString(),
    ];

    switch (payrollFrequency) {
      case PayrollFrequency.Weekly:
        totalWorkedHours = totalWeek1WorkedHour;
        totalOvertime = totalWeek1OverTime;
        grandTotal = totalWorkedHours + totalOvertime;
        departmentTotalRow.push(
          totalWeek1WorkedHour.toFixed(2),
          totalWeek1OverTime.toFixed(2),
          grandTotal.toFixed(2),
          grandTotal.toFixed(2),
        );
        break;

      case PayrollFrequency.BiWeekly:
        totalWorkedHours = totalWeek1WorkedHour + totalWeek2WorkedHour;
        totalOvertime = totalWeek1OverTime + totalWeek2OverTime;
        grandTotal = totalWorkedHours + totalOvertime;
        departmentTotalRow.push(
          totalWeek1WorkedHour.toFixed(2),
          totalWeek1OverTime.toFixed(2),
          (totalWeek1WorkedHour + totalWeek1OverTime).toFixed(2),
          totalWeek2WorkedHour.toFixed(2),
          totalWeek2OverTime.toFixed(2),
          (totalWeek2WorkedHour + totalWeek2OverTime).toFixed(2),
          grandTotal.toFixed(2),
        );
        break;

      case PayrollFrequency.Monthly:
        totalWorkedHours = totalMonth1WorkedHour;
        totalOvertime = totalMonth1OverTime;
        grandTotal = totalWorkedHours + totalOvertime;
        departmentTotalRow.push(
          totalMonth1WorkedHour.toFixed(2),
          totalMonth1OverTime.toFixed(2),
          grandTotal.toFixed(2),
          grandTotal.toFixed(2),
        );
        break;

      case PayrollFrequency.BiMonthly:
        totalWorkedHours = totalMonth1WorkedHour + totalMonth2WorkedHour;
        totalOvertime = totalMonth1OverTime + totalMonth2OverTime;
        grandTotal = totalWorkedHours + totalOvertime;
        departmentTotalRow.push(
          totalMonth1WorkedHour.toFixed(2),
          totalMonth1OverTime.toFixed(2),
          (totalMonth1WorkedHour + totalMonth1OverTime).toFixed(2),
          totalMonth2WorkedHour.toFixed(2),
          totalMonth2OverTime.toFixed(2),
          (totalMonth2WorkedHour + totalMonth2OverTime).toFixed(2),
          grandTotal.toFixed(2),
        );
        break;
    }

    departmentTotalRow.push(
      this.holidayvalues,
      this.holidayvalues,
      this.holidayvalues,
      this.holidayvalues,
      grandTotal.toFixed(2),
      (grandTotal / totalDaysWorked).toFixed(2),
    );

    return departmentTotalRow;
  }

  private getHeaderListByPayrollFrequency(
    payrollFrequency: PayrollFrequency,
    isStoreAndGrandTotal: boolean = false,
  ): string[] {
    const commonHeaders = [
      isStoreAndGrandTotal ? '' : this.localizationService.instant('::Report:PayPeriod.EmpCode'),
      isStoreAndGrandTotal ? '' : this.localizationService.instant('::SalesRepReport:EmployeeName'),
      this.localizationService.instant('::Report:PayPeriod.DaysWorked'),
    ];

    let frequencyHeaders: string[] = [];
    switch (payrollFrequency) {
      case PayrollFrequency.Weekly:
        frequencyHeaders = [
          this.localizationService.instant('::Report:PayPeriod.Week1Work'),
          this.localizationService.instant('::Report:PayPeriod.Week1Ot'),
          this.localizationService.instant('::Pos:OrderItemColum:Total'),
        ];
        break;
      case PayrollFrequency.Monthly:
        frequencyHeaders = [
          this.localizationService.instant('::Report:PayPeriod.Month1Work'),
          this.localizationService.instant('::Report:PayPeriod.Month1Ot'),
          this.localizationService.instant('::Pos:OrderItemColum:Total'),
        ];
        break;

      case PayrollFrequency.BiWeekly:
        frequencyHeaders = [
          this.localizationService.instant('::Report:PayPeriod.Week1Work'),
          this.localizationService.instant('::Report:PayPeriod.Week1Ot'),
          this.localizationService.instant('::Pos:OrderItemColum:Total'),
          this.localizationService.instant('::Report:PayPeriod.Week2Work'),
          this.localizationService.instant('::Report:PayPeriod.Week2Ot'),
          this.localizationService.instant('::Pos:OrderItemColum:Total'),
        ];
        break;
      case PayrollFrequency.BiMonthly:
        frequencyHeaders = [
          this.localizationService.instant('::Report:PayPeriod.Month1Work'),
          this.localizationService.instant('::Report:PayPeriod.Month1Ot'),
          this.localizationService.instant('::Pos:OrderItemColum:Total'),
          this.localizationService.instant('::Report:PayPeriod.Month2Work'),
          this.localizationService.instant('::Report:PayPeriod.Month2Ot'),
          this.localizationService.instant('::Pos:OrderItemColum:Total'),
        ];
        break;
    }

    const finalHeaders = [
      ...commonHeaders,
      ...frequencyHeaders,
      this.localizationService.instant('::SalesRepReport:HoursWorked'),
      this.localizationService.instant('::Report:PayPeriod.Sick'),
      this.localizationService.instant('::Report:PayPeriod.Hol'),
      this.localizationService.instant('::Report:PayPeriod.Vac'),
      this.localizationService.instant('::Report:PayPeriod.0th'),
      this.localizationService.instant('::Report:PayPeriod.TotalHours'),
      this.localizationService.instant('::Report:PayPeriod.AvgHour'),
      this.localizationService.instant('::Report:PayPeriod.TotalReg'),
      this.localizationService.instant('::Report:PayPeriod.TotalOt'),
    ];

    return finalHeaders;
  }

  private addLogo(doc: jsPDF, logoBase64: string, headerTitle: string): void {
    doc.addImage(logoBase64, 'jpg', 123, 10, 50, 20);
    doc.setFontSize(18);
    doc.text(headerTitle, 148.5, 40, { align: 'center' });
  }

  private groupBy(data: EmployeeWorkHourDto[], key: string): Record<string, EmployeeWorkHourDto[]> {
    return data.reduce(
      (acc, item) => {
        (acc[item[key]] = acc[item[key]] || []).push(item);
        return acc;
      },
      {} as Record<string, EmployeeWorkHourDto[]>,
    );
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
    departments: string[],
  ): string[][] {
    const allSelectionText = this.localizationService.instant(
      '::Reports:OrderReport:Filter:AllSelect',
    );
    const fromDate = input.fromDate ? new Date(input.fromDate).toLocaleDateString() : '';
    const toDate = input.toDate ? new Date(input.toDate).toLocaleDateString() : '';
    const selectedDateInfo = fromDate && toDate ? `${fromDate} To ${toDate}` : '';
    const storeNames =
      stores.length > 0 ? formatInputFilterListWithOthers(stores) : allSelectionText;
    const departmentNames =
      departments.length > 0 ? formatInputFilterListWithOthers(departments) : allSelectionText;

    return [
      [
        this.localizationService.instant('::Reports:Common:FilterDate'),
        selectedDateInfo,
        `${this.localizationService.instant('::Employee.Fields.Department')}:`,
        departmentNames,
      ],
      [this.localizationService.instant('::Reports:Common:StoresFilter'), storeNames],
    ];
  }

  private addFilterTable(doc: jsPDF, filterBody: string[][]): void {
    autoTable(doc, {
      body: filterBody,
      startY: 50,
      theme: 'plain',
      styles: {
        fontSize: 11,
      },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'right', minCellWidth: 55 },
        1: { halign: 'left', minCellWidth: 80 },
        2: { fontStyle: 'bold', halign: 'right', minCellWidth: 55 },
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
