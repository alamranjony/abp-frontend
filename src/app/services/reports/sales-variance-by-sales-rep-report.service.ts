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
import { DateRangeType } from 'src/app/models/date-range-type';
import { formatInputFilterListWithOthers } from './reports-utils';

type FilterRow = [string, string, string, string];
type FilterTableBody = FilterRow[];
type ParsedDateRange = { from: Date; to: Date };

@Injectable({
  providedIn: 'root',
})
export class SalesVarianceBySalesRepReportService implements OnDestroy {
  private readonly logoUrl = 'assets/images/logo/ffc-logo.jpg';
  destroy$: Subject<void> = new Subject();
  pdfSavedName: string = 'Sales Variance By Sales Reps';

  constructor(
    private http: HttpClient,
    private toasterService: ToasterService,
    private reportService: ReportService,
    private localizationService: LocalizationService,
  ) {}

  generateReport(
    input: InputFilterDto,
    stores: string[],
    firstColumnDateRange: DateRangeType,
    secondColumnDateRange: DateRangeType,
    thirdColumnDateRange: DateRangeType,
    fourthColumnDateRange: DateRangeType,
    amount: number,
  ) {
    forkJoin([
      this.reportService.generateSalesVarianceBySalesRepPdfReport(input),
      this.http.get(this.logoUrl, { responseType: 'blob' }),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([employees, logoBlob]) => {
        const reader = new FileReader();
        reader.readAsDataURL(logoBlob);
        reader.onloadend = () => {
          const logoBase64 = reader.result as string;
          this.generateSalesVarianceBySalesRepPdf(
            employees,
            logoBase64,
            stores,
            firstColumnDateRange,
            secondColumnDateRange,
            thirdColumnDateRange,
            fourthColumnDateRange,
            amount,
          );
        };
      });
  }

  private generateSalesVarianceBySalesRepPdf(
    employees: EmployeeWorkHourDto[],
    logoBase64: string,
    stores: string[],
    firstColumnDateRange: DateRangeType,
    secondColumnDateRange: DateRangeType,
    thirdColumnDateRange: DateRangeType,
    fourthColumnDateRange: DateRangeType,
    amount: number,
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

    const detailsReportBody = this.getSalesRepVarianceReportBody(
      employees,
      firstColumnDateRange,
      secondColumnDateRange,
      thirdColumnDateRange,
      fourthColumnDateRange,
    );

    if (!detailsReportBody || detailsReportBody.length === 0) {
      this.toasterService.warn('::CustomerProductAnalysisReport:NotFound');
      return;
    }

    const grandTotalsRow = this.calculateGrandTotals(detailsReportBody);
    const columnHeight = stores.length > 3 ? 85 : 80;

    autoTable(doc, {
      startY: columnHeight,
      head: [
        [
          this.localizationService.instant('::SalesVarianceBySalesRepReport:SalesPerson'),
          this.localizationService.instant('::SalesVarianceBySalesRepReport:Amount'),
          this.localizationService.instant('::SalesVarianceBySalesRepReport:Orders'),
          this.localizationService.instant('::SalesVarianceBySalesRepReport:Average'),
          this.localizationService.instant('::SalesVarianceBySalesRepReport:Variance'),
          this.localizationService.instant('::SalesVarianceBySalesRepReport:Amount'),
          this.localizationService.instant('::SalesVarianceBySalesRepReport:Orders'),
          this.localizationService.instant('::SalesVarianceBySalesRepReport:Average'),
          this.localizationService.instant('::SalesVarianceBySalesRepReport:Variance'),
          this.localizationService.instant('::SalesVarianceBySalesRepReport:Amount'),
          this.localizationService.instant('::SalesVarianceBySalesRepReport:Orders'),
          this.localizationService.instant('::SalesVarianceBySalesRepReport:Average'),
          this.localizationService.instant('::SalesVarianceBySalesRepReport:Variance'),
          this.localizationService.instant('::SalesVarianceBySalesRepReport:Amount'),
          this.localizationService.instant('::SalesVarianceBySalesRepReport:Orders'),
          this.localizationService.instant('::SalesVarianceBySalesRepReport:Average'),
        ],
      ],
      body: [...detailsReportBody, grandTotalsRow],
      didDrawPage: data => {
        this.addPageHeader(
          doc,
          logoBase64,
          currentTime,
          data.pageNumber,
          this.localizationService.instant('::Menu:SalesVarianceBySalesRep'),
        );
        const filterBody = this.getFilterTableBody(
          stores,
          firstColumnDateRange,
          secondColumnDateRange,
          thirdColumnDateRange,
          fourthColumnDateRange,
          amount,
        );
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
    });

    doc.save(this.pdfSavedName);
  }

  private calculateGrandTotals(detailsReportBody: string[][]): string[] {
    let grandAmt1 = 0,
      grandAmt2 = 0,
      grandAmt3 = 0,
      grandAmt4 = 0;
    let grandOdrs1 = 0,
      grandOdrs2 = 0,
      grandOdrs3 = 0,
      grandOdrs4 = 0;

    detailsReportBody.forEach(row => {
      const amt1 = parseFloat(row[1].replace('$', '')) || 0;
      const amt2 = parseFloat(row[5].replace('$', '')) || 0;
      const amt3 = parseFloat(row[9].replace('$', '')) || 0;
      const amt4 = parseFloat(row[13].replace('$', '')) || 0;

      const odrs1 = parseInt(row[2], 10) || 0;
      const odrs2 = parseInt(row[6], 10) || 0;
      const odrs3 = parseInt(row[10], 10) || 0;
      const odrs4 = parseInt(row[14], 10) || 0;

      grandAmt1 += amt1;
      grandOdrs1 += odrs1;
      grandAmt2 += amt2;
      grandOdrs2 += odrs2;
      grandAmt3 += amt3;
      grandOdrs3 += odrs3;
      grandAmt4 += amt4;
      grandOdrs4 += odrs4;
    });

    const grandAvg1 = grandOdrs1 > 0 ? (grandAmt1 / grandOdrs1).toFixed(2) : '0';
    const grandAvg2 = grandOdrs2 > 0 ? (grandAmt2 / grandOdrs2).toFixed(2) : '0';
    const grandAvg3 = grandOdrs3 > 0 ? (grandAmt3 / grandOdrs3).toFixed(2) : '0';
    const grandAvg4 = grandOdrs4 > 0 ? (grandAmt4 / grandOdrs4).toFixed(2) : '0';

    const grandVar1 = this.calculateVariance(grandAmt1, grandAmt2);
    const grandVar2 = this.calculateVariance(grandAmt2, grandAmt3);
    const grandVar3 = this.calculateVariance(grandAmt3, grandAmt4);

    return [
      this.localizationService.instant('::SalesRepReport:GrandTotal'),
      `$${grandAmt1.toFixed(2)}`,
      grandOdrs1.toString(),
      `$${grandAvg1}`,
      grandVar1,
      `$${grandAmt2.toFixed(2)}`,
      grandOdrs2.toString(),
      `$${grandAvg2}`,
      grandVar2,
      `$${grandAmt3.toFixed(2)}`,
      grandOdrs3.toString(),
      `$${grandAvg3}`,
      grandVar3,
      `$${grandAmt4.toFixed(2)}`,
      grandOdrs4.toString(),
      `$${grandAvg4}`,
    ];
  }

  private getSalesRepVarianceReportBody(
    employees: EmployeeWorkHourDto[],
    firstColumnDateRange: DateRangeType,
    secondColumnDateRange: DateRangeType,
    thirdColumnDateRange: DateRangeType,
    fourthColumnDateRange: DateRangeType,
  ) {
    const dateRanges = [
      this.parseDateRange(firstColumnDateRange),
      this.parseDateRange(secondColumnDateRange),
      this.parseDateRange(thirdColumnDateRange),
      this.parseDateRange(fourthColumnDateRange),
    ];

    const filteredData = dateRanges.map(range => this.filterAndGroupOrders()(employees, range));
    return this.combineEmployeeData(filteredData);
  }

  private combineEmployeeData(filteredData: Record<string, EmployeeWorkHourDto[]>[]) {
    const finalGroupOrders = filteredData.reduce(
      (combined, currentRange, index) => {
        for (const employeeId in currentRange) {
          if (!combined[employeeId]) {
            combined[employeeId] = {
              EmployeeId: employeeId,
              EmployeeName: currentRange[employeeId][0].employeeName,
              OrdersFilled: [0, 0, 0, 0],
              ValueProduced: [0, 0, 0, 0],
            };
          }

          // Calculate Sum for Orders and Values for this date range
          combined[employeeId].OrdersFilled[index] = new Set(
            currentRange[employeeId].map(o => o.subOrderId),
          ).size;
          combined[employeeId].ValueProduced[index] = currentRange[employeeId].reduce(
            (sum, o) => sum + o.valueProduced,
            0,
          );
        }
        return combined;
      },
      {} as Record<
        string,
        {
          EmployeeId: string;
          EmployeeName: string;
          OrdersFilled: number[];
          ValueProduced: number[];
        }
      >,
    );

    return Object.values(finalGroupOrders).map(emp => {
      const row = [`${emp.EmployeeId}-${emp.EmployeeName}`];

      for (let i = 0; i < 4; i++) {
        row.push(`$${emp.ValueProduced[i].toFixed(2)}`);
        row.push(emp.OrdersFilled[i].toString());
        row.push(
          emp.OrdersFilled[i] > 0
            ? `$${(emp.ValueProduced[i] / emp.OrdersFilled[i]).toFixed(2)}`
            : '$0',
        );

        if (i < 3) {
          row.push(this.calculateVariance(emp.ValueProduced[i], emp.ValueProduced[i + 1]));
        }
      }

      return row;
    });
  }

  private filterAndGroupOrders() {
    return (orders: EmployeeWorkHourDto[], dateRange: { from: Date; to: Date }) => {
      const fromDateOnly = new Date(dateRange.from.setHours(0, 0, 0, 0));
      const toDateWithEndTime = new Date(dateRange.to.setHours(23, 59, 59, 999));

      return orders
        .filter(({ deliveredDate }) => {
          const date = new Date(deliveredDate);
          return date >= fromDateOnly && date <= toDateWithEndTime;
        })
        .reduce(
          (grouped, order) => {
            if (!grouped[order.employeeId]) {
              grouped[order.employeeId] = [];
            }
            grouped[order.employeeId].push(order);
            return grouped;
          },
          {} as Record<string, EmployeeWorkHourDto[]>,
        );
    };
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
    stores: string[],
    firstColumnDateRange: DateRangeType,
    secondColumnDateRange: DateRangeType,
    thirdColumnDateRange: DateRangeType,
    fourthColumnDateRange: DateRangeType,
    amount: number,
  ): FilterTableBody {
    const allSelectionText = this.localizationService.instant(
      '::Reports:OrderReport:Filter:AllSelect',
    );
    const firstFromDate = this.formatDate(firstColumnDateRange.fromDate);
    const firstToDate = this.formatDate(firstColumnDateRange.toDate);
    const secondFromDate = this.formatDate(secondColumnDateRange.fromDate);
    const secondToDate = this.formatDate(secondColumnDateRange.toDate);
    const thirdFromDate = this.formatDate(thirdColumnDateRange.fromDate);
    const thirdToDate = this.formatDate(thirdColumnDateRange.toDate);
    const fourthFromDate = this.formatDate(fourthColumnDateRange.fromDate);
    const fourthToDate = this.formatDate(fourthColumnDateRange.toDate);

    const storeNames =
      stores.length > 0 ? formatInputFilterListWithOthers(stores) : allSelectionText;
    const firstSelectedDateInfo =
      firstFromDate && firstToDate ? `${firstFromDate} To ${firstToDate}` : '';
    const secondSelectedDateInfo =
      secondFromDate && secondToDate ? `${secondFromDate} To ${secondToDate}` : '';
    const thirdSelectedDateInfo =
      thirdFromDate && thirdToDate ? `${thirdFromDate} To ${thirdToDate}` : '';
    const fourthSelectedDateInfo =
      fourthFromDate && fourthToDate ? `${fourthFromDate} To ${fourthToDate}` : '';

    return [
      [
        this.localizationService.instant('::SalesVarianceBySalesRepReport:DateColumn1') + ':',
        firstSelectedDateInfo,
        this.localizationService.instant('::SalesVarianceBySalesRepReport:DateColumn2') + ':',
        secondSelectedDateInfo,
      ],
      [
        this.localizationService.instant('::SalesVarianceBySalesRepReport:DateColumn3') + ':',
        thirdSelectedDateInfo,
        this.localizationService.instant('::SalesVarianceBySalesRepReport:DateColumn4') + ':',
        fourthSelectedDateInfo,
      ],
      [
        this.localizationService.instant('::Menu:Stores') + ':',
        storeNames,
        this.localizationService.instant('::SalesVarianceBySalesRepReport:TotalMdse') + ':',
        amount?.toString(),
      ],
    ];
  }

  private addFilterTable(doc: jsPDF, filterBody: FilterTableBody): void {
    autoTable(doc, {
      body: filterBody,
      startY: 50,
      theme: 'plain',
      styles: {
        fontSize: 11,
      },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'right', minCellWidth: 60 },
        1: { halign: 'left', minCellWidth: 100 },
        2: { fontStyle: 'bold', halign: 'right', minCellWidth: 60 },
        3: { halign: 'left', minCellWidth: 100 },
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

  private parseDateRange(range: DateRangeType): ParsedDateRange {
    return {
      from: new Date(range.fromDate),
      to: new Date(range.toDate),
    };
  }

  private calculateVariance(previous: number, current: number): string {
    if (previous === 0 && current === 0) {
      return '0.0 %';
    } else if (previous === 0 && current > 0) {
      return '100.0';
    } else if (previous > 0 && current === 0) {
      return '0.0 %';
    } else {
      const variance = ((previous - current) / current) * 100;
      return variance >= 0 ? `${variance.toFixed(1)} %` : `${Math.abs(variance).toFixed(1)}-%`;
    }
  }

  private formatDate = (date: string | Date | null | undefined): string =>
    date ? new Date(date).toLocaleDateString() : '';

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
