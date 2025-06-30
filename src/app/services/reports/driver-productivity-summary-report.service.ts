import { Injectable, OnDestroy } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ToasterService } from '@abp/ng.theme.shared';
import { DriverTripSummaryDto, InputFilterDto, ReportService } from '@proxy/reports';
import { LocalizationService } from '@abp/ng.core';
import trebucFont from 'src/assets/fonts/trebuc-normal.js';
import {
  REPORT_FONT_FILE_NAME,
  REPORT_FONT_NAME,
  REPORT_FONT_TYPE,
  REPORT_HEADER_BACKGROUND_COLOR,
  REPORT_HEADER_TEXT_COLOR,
} from 'src/app/shared/constants';

@Injectable({
  providedIn: 'root',
})
export class DriverProductivitySummaryReportService implements OnDestroy {
  private readonly logoUrl = 'assets/images/logo/ffc-logo.jpg';
  destroy$: Subject<void> = new Subject();
  pdfSavedName: string = 'Driver Summary Report.pdf';

  constructor(
    private http: HttpClient,
    private toasterService: ToasterService,
    private reportService: ReportService,
    private localizationService: LocalizationService,
  ) {}

  generateReport(input: InputFilterDto) {
    forkJoin([
      this.reportService.generateDriverSummaryPdfReport(input),
      this.http.get(this.logoUrl, { responseType: 'blob' }),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([tripDetails, logoBlob]) => {
        if (!tripDetails?.length) {
          this.toasterService.warn('::CustomerProductAnalysisReport:NotFound');
          return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(logoBlob);
        reader.onloadend = () => {
          const logoBase64 = reader.result as string;
          this.generateDriverSummaryReportPdf(tripDetails, logoBase64, input);
        };
      });
  }

  private generateDriverSummaryReportPdf(
    tripDetails: DriverTripSummaryDto[],
    logoBase64: string,
    input: InputFilterDto,
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

    const detailsReportBody = this.getDetailsReportBody(tripDetails);
    autoTable(doc, {
      startY: 60,
      head: [
        [
          this.localizationService.instant('::SalesRepReport:Rank'),
          this.localizationService.instant('::SalesRepReport:EmployeeName'),
          this.localizationService.instant('::DriverSummaryReport:HoursWorked'),
          this.localizationService.instant('::DriverSummaryReport:DriveTime'),
          this.localizationService.instant('::DriverSummaryReport:ETATime'),
          this.localizationService.instant('::DriverSummaryReport:NonDriveTime'),
          this.localizationService.instant('::DriverSummaryReport:MilesDriven'),
          this.localizationService.instant('::DriverSummaryReport:NumberOfTrips'),
          this.localizationService.instant('::DriverSummaryReport:NumberOfStops'),
          this.localizationService.instant('::DriverSummaryReport:NonDelivery'),
          this.localizationService.instant('::DriverSummaryReport:OnTimeRating'),
          this.localizationService.instant('::DriverSummaryReport:TimeOnRoad'),
          this.localizationService.instant('::DriverSummaryReport:CompletedDeliveries'),
          this.localizationService.instant('::DriverSummaryReport:ActualDeliveryHour'),
          this.localizationService.instant('::DriverSummaryReport:ExpectedDeliveryHour'),
          this.localizationService.instant('::DriverSummaryReport:ActualAverageMiles'),
          this.localizationService.instant('::DriverSummaryReport:ExpectedAverageMiles'),
        ],
      ],
      body: detailsReportBody,
      didDrawPage: data => {
        this.addPageHeader(
          doc,
          logoBase64,
          currentTime,
          data.pageNumber,
          this.localizationService.instant('::DriverSummaryReport:Title'),
        );
        const filterBody = this.getFilterTableBody(input);
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

    doc.save(this.pdfSavedName);
  }

  private getDetailsReportBody(tripDetails: DriverTripSummaryDto[]) {
    const reportBody = [];
    tripDetails.forEach((tripDetail, index) => {
      reportBody.push([
        index + 1,
        tripDetail.employeeName,
        this.getToFixedResult(tripDetail.hoursWorked),
        this.getToFixedResult(tripDetail.driveTime),
        this.getToFixedResult(tripDetail.etaTime),
        this.getToFixedResult(tripDetail.nonDriveTime),
        this.getToFixedResult(tripDetail.milesDriven),
        tripDetail.noOfTrips,
        tripDetail.noOfStops,
        tripDetail.nonDeliveredItems,
        this.getToFixedResult(tripDetail.onTimeRating, true),
        this.getToFixedResult(tripDetail.timeOnRoad, true),
        this.getToFixedResult(tripDetail.nonDriveTimePercentage, true),
        this.getToFixedResult(tripDetail.completedDeliveries, true),
        this.getToFixedResult(tripDetail.actualDeliveriesHour),
        this.getToFixedResult(tripDetail.expectedDeliveriesHour),
        this.getToFixedResult(tripDetail.actualAverageMiles),
        this.getToFixedResult(tripDetail.expectedAverageMiles),
      ]);
    });

    const grandTotal = tripDetails.reduce(
      (total, tripDetail) => {
        total.hoursWorked += tripDetail.hoursWorked;
        total.driveTime += tripDetail.driveTime;
        total.etaTime += tripDetail.etaTime;
        total.nonDriveTime += tripDetail.nonDriveTime;
        total.milesDriven += tripDetail.milesDriven;
        total.totalTrips += tripDetail.noOfTrips;
        total.totalStops += tripDetail.noOfStops;
        total.nonDeliveredItems += tripDetail.nonDeliveredItems;
        total.onTimeRating += tripDetail.onTimeRating;
        total.timeOnRoad += tripDetail.timeOnRoad;
        total.nonDriveTimePercentage += tripDetail.nonDriveTimePercentage;
        total.completedDeliveries += tripDetail.completedDeliveries;

        total.actualDeliveries += tripDetail.actualDeliveriesHour;
        total.expectedDeliveries += tripDetail.expectedDeliveriesHour;
        total.actualAverageMiles += tripDetail.actualAverageMiles;
        total.expectedAverageMiles += tripDetail.expectedAverageMiles;

        return total;
      },
      {
        hoursWorked: 0,
        driveTime: 0,
        etaTime: 0,
        nonDriveTime: 0,
        milesDriven: 0,
        totalTrips: 0,
        totalStops: 0,
        nonDeliveredItems: 0,
        onTimeRating: 0,
        timeOnRoad: 0,
        nonDriveTimePercentage: 0,
        completedDeliveries: 0,
        actualDeliveries: 0,
        expectedDeliveries: 0,
        actualAverageMiles: 0,
        expectedAverageMiles: 0,
      },
    );

    reportBody.push([
      '',
      this.localizationService.instant('::SalesRepReport:GrandTotal'),
      this.getToFixedResult(grandTotal.hoursWorked),
      this.getToFixedResult(grandTotal.driveTime),
      this.getToFixedResult(grandTotal.etaTime),
      this.getToFixedResult(grandTotal.nonDriveTime),
      this.getToFixedResult(grandTotal.milesDriven),
      grandTotal.totalTrips,
      grandTotal.totalTrips,
      grandTotal.nonDeliveredItems,
      this.getToFixedResult(grandTotal.onTimeRating, true),
      this.getToFixedResult(grandTotal.timeOnRoad, true),
      this.getToFixedResult(grandTotal.nonDriveTimePercentage, true),
      this.getToFixedResult(grandTotal.completedDeliveries, true),
      this.getToFixedResult(grandTotal.actualDeliveries),
      this.getToFixedResult(grandTotal.expectedDeliveries),
      this.getToFixedResult(grandTotal.actualAverageMiles),
      this.getToFixedResult(grandTotal.expectedAverageMiles),
    ]);

    return reportBody;
  }

  private getToFixedResult(value: number, isPercentage = false): string {
    if (isPercentage) return value.toFixed(2) + '%';
    return value.toFixed(2);
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

  private getFilterTableBody(input: InputFilterDto): any[][] {
    const fromDate = input.fromDate ? new Date(input.fromDate).toLocaleDateString() : '';
    const toDate = input.toDate ? new Date(input.toDate).toLocaleDateString() : '';
    const selectedDateInfo = fromDate && toDate ? `${fromDate} To ${toDate}` : '';

    return [[this.localizationService.instant('::Reports:Common:FilterDate'), selectedDateInfo]];
  }

  private addFilterTable(doc: jsPDF, filterBody: any[][]): void {
    autoTable(doc, {
      body: filterBody,
      startY: 45,
      theme: 'plain',
      styles: {
        fontSize: 11,
      },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'right', minCellWidth: 60 },
        1: { halign: 'left', minCellWidth: 80 },
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
