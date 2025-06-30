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
import { TripService } from '@proxy/trips';
import {
  DriverSummaryListItemDto,
  FilterTripsRequestDto,
  tripStatusTypeOptions,
} from '@proxy/delivery-management';
import { formatInputFilterListWithOthers } from './reports-utils';

@Injectable({
  providedIn: 'root',
})
export class DriverSummaryReportService implements OnDestroy {
  private readonly logoUrl = 'assets/images/logo/ffc-logo.jpg';
  destroy$: Subject<void> = new Subject();
  pdfSavedName: string = 'Driver_Summary_Report.pdf';

  constructor(
    private http: HttpClient,
    private toasterService: ToasterService,
    private tripService: TripService,
    private localizationService: LocalizationService,
  ) {}

  generateReport(input: FilterTripsRequestDto, employee: string, stores: string[]) {
    forkJoin([
      this.tripService.getTripWithDriverInfo(input),
      this.http.get(this.logoUrl, { responseType: 'blob' }),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([trips, logoBlob]) => {
        if (!trips?.length) {
          this.toasterService.warn('::CustomerProductAnalysisReport:NotFound');
          return;
        }
        const reader = new FileReader();
        reader.readAsDataURL(logoBlob);
        reader.onloadend = () => {
          const logoBase64 = reader.result as string;

          this.generateDriverSummaryReportPdf(trips, logoBase64, input, employee, stores);
        };
      });
  }

  private generateDriverSummaryReportPdf(
    trips: DriverSummaryListItemDto[],
    logoBase64: string,
    input: FilterTripsRequestDto,
    employee: string,
    stores: string[],
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

    const detailsReportBody = this.getDriverSummaryReportBody(trips);
    const columnHeight = input.storeIds.length > 3 ? 75 : 70;

    autoTable(doc, {
      startY: columnHeight,
      head: [
        [
          this.localizationService.instant('::Delivery:DriverName'),
          this.localizationService.instant('::Delivery:PhoneNumber'),
          this.localizationService.instant('::Delivery:VehicleModel'),
          this.localizationService.instant('::Vehicle:VehicleNo'),
          this.localizationService.instant('::Delivery:TripStatus'),
          this.localizationService.instant('::Delivery:CheckOutTime'),
          this.localizationService.instant('::Delivery:CheckInTime'),
          this.localizationService.instant('::Delivery:ETA'),
        ],
      ],
      body: detailsReportBody,
      didDrawPage: data => {
        this.addPageHeader(
          doc,
          logoBase64,
          currentTime,
          data.pageNumber,
          this.localizationService.instant('::Menu:DriverSummary'),
        );
        const filterBody = this.getFilterTableBody(input, employee, stores);
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

  private getDriverSummaryReportBody(trips: DriverSummaryListItemDto[]) {
    const reportBody = trips.map(trip => [
      trip.driverName,
      trip.phoneNumber,
      trip.vehicleModel,
      trip.vehicleNo,
      this.getEnumDisplayName(tripStatusTypeOptions, trip.tripStatusType),
      trip.checkedOutAt ? new Date(trip.checkedOutAt).toLocaleDateString() : '',
      trip.checkedInAt ? new Date(trip.checkedInAt).toLocaleDateString() : '',
      trip.eta,
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
    input: FilterTripsRequestDto,
    employee: string,
    stores: string[],
  ): any[][] {
    const allSelectionText = this.localizationService.instant(
      '::Reports:OrderReport:Filter:AllSelect',
    );
    const deliveryDate = input.deliveryDate
      ? new Date(input.deliveryDate).toLocaleDateString()
      : '';
    const storeNames =
      stores.length > 0 ? formatInputFilterListWithOthers(stores) : allSelectionText;

    return [
      [
        `${this.localizationService.instant('::Delivery:RouteDate')}:`,
        deliveryDate,
        this.localizationService.instant('::Reports:Common:StoresFilter'),
        storeNames,
      ],
      [
        `${this.localizationService.instant('::Delivery:TripStatus')}:`,
        this.getEnumDisplayName(tripStatusTypeOptions, input.tripStatus),
        `${this.localizationService.instant('::MiscOrder:EmployeeName')}:`,
        employee,
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

  private getEnumDisplayName(enumOptions: any[], enumValue: number): string {
    const option = enumOptions.find(option => option.value === enumValue);
    return option ? option.key : '-';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
