import { Injectable, OnDestroy } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ToasterService } from '@abp/ng.theme.shared';
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
import { CheckInOutDto, GetCheckInOutListDto } from '@proxy/check-in-outs';
import { PayrollService } from '@proxy/payrolls';
import { getCurrentTime } from 'src/app/shared/date-time-utils';
import { CreatePrintJobDto, PrintJobType, PrintNodeService } from '@proxy/print-node';

@Injectable({
  providedIn: 'root',
})
export class PayrollReportService implements OnDestroy {
  private readonly logoUrl = 'assets/images/logo/ffc-logo.jpg';
  destroy$: Subject<void> = new Subject();

  constructor(
    private http: HttpClient,
    private toasterService: ToasterService,
    private payrollService: PayrollService,
    private localizationService: LocalizationService,
    private readonly printNodeService: PrintNodeService,
  ) {}

  printPdf(
    startDate: string,
    endDate: string,
    stores: string[],
    storeNames: string[],
    employeeId: string,
  ) {
    const input = {
      startDate,
      endDate,
      employeeId,
      stores,
    } as GetCheckInOutListDto;
    forkJoin([
      this.payrollService.getFilteredPayrollList(input),
      this.http.get(this.logoUrl, { responseType: 'blob' }),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([payrolls, logoBlob]) => {
        if (!payrolls || payrolls.length === 0) {
          this.toasterService.warn('::CustomerProductAnalysisReport:NotFound');
          return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(logoBlob);
        reader.onloadend = () => {
          const logoBase64 = reader.result as string;
          const doc = this.generatePayrollReport(
            startDate,
            endDate,
            payrolls,
            logoBase64,
            storeNames,
            employeeId ? payrolls[0].displayName : '',
          );

          const orderPrintJob: CreatePrintJobDto = {
            source: 'payroll-list',
            printJobType: PrintJobType.LocalOrder,
            base64Content: doc.output('datauristring').split(',')[1],
          } as CreatePrintJobDto;

          const request = this.printNodeService.createPrintJob(orderPrintJob);
          request.pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
              this.toasterService.success('::InvoicePrint:PrintSuccess');
            },
            error: () => {
              this.toasterService.error('::InvoicePrint:PrintError');
            },
          });
        };
      });
  }

  private generatePayrollReport(
    fromDate: string,
    toDate: string,
    payrolls: CheckInOutDto[],
    logoBase64: string,
    stores: string[],
    employeeDisplayName: string,
  ): jsPDF {
    const doc = new jsPDF({ orientation: 'landscape' });
    this.useTrebucFont(doc);
    doc.setFontSize(12);

    const detailsReportBody = this.getPayrollReportBody(payrolls);

    const columnHeight = stores.length > 3 ? 75 : 70;

    autoTable(doc, {
      startY: columnHeight,
      head: [
        [
          this.localizationService.instant('::Payroll:Date'),
          this.localizationService.instant('::Payroll:Employee'),
          this.localizationService.instant('::TimeClock:Department'),
          this.localizationService.instant('::TimeClock:Location'),
          this.localizationService.instant('::Menu:CheckIn'),
          this.localizationService.instant('::Menu:CheckOut'),
          this.localizationService.instant('::TimeClock:Comment'),
        ],
      ],
      body: detailsReportBody,
      didDrawPage: data => {
        this.addPageHeader(
          doc,
          logoBase64,
          getCurrentTime(),
          data.pageNumber,
          this.localizationService.instant('::Payroll:Title'),
        );
        const filterBody = this.getFilterTableBody(fromDate, toDate, stores, employeeDisplayName);
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

    return doc;
  }

  private getPayrollReportBody(payrolls: CheckInOutDto[]): string[][] {
    const reportBody = payrolls.map(payroll => [
      new Date(payroll.currentTime).toLocaleDateString(),
      payroll.displayName,
      payroll.departmentName,
      payroll.storeName,
      new Date(payroll.currentTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      new Date(payroll.checkoutTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      payroll.comment?.length ? payroll.comment : '-',
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
    fromDate: string,
    toDate: string,
    stores: string[],
    employee: string,
  ): any[][] {
    const allSelectionText = this.localizationService.instant(
      '::Reports:OrderReport:Filter:AllSelect',
    );
    const selectedDateInfo =
      fromDate && toDate
        ? `${new Date(fromDate).toLocaleDateString()} To ${new Date(toDate).toLocaleDateString()}`
        : '';
    const storeNames =
      stores.length > 0 ? formatInputFilterListWithOthers(stores) : allSelectionText;

    return [
      [
        this.localizationService.instant('::Reports:Common:FilterDate'),
        selectedDateInfo,
        this.localizationService.instant('::Reports:Common:StoresFilter'),
        storeNames,
      ],
      [`${this.localizationService.instant('::ValueType:Parent:Employees')}:`, employee],
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

  private useTrebucFont(doc: jsPDF): void {
    doc.addFileToVFS(REPORT_FONT_FILE_NAME, trebucFont);
    doc.addFont(REPORT_FONT_FILE_NAME, REPORT_FONT_NAME, REPORT_FONT_TYPE);
    doc.setFont(REPORT_FONT_NAME, REPORT_FONT_TYPE);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
