import { Injectable, OnDestroy } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ToasterService } from '@abp/ng.theme.shared';
import { InputFilterDto, ReportService } from '@proxy/reports';
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
import { SubOrderControlListDto } from '@proxy/orders';
import { formatInputFilterListWithOthers } from './reports-utils';

type FilterRow = [string, string] | [string, string, string, string];
type FilterTableBody = FilterRow[];
type ParsedDateRange = { from: Date; to: Date };

@Injectable({
  providedIn: 'root',
})
export class DisCountGrantedAnalysisReportService implements OnDestroy {
  private readonly logoUrl = 'assets/images/logo/ffc-logo.jpg';
  destroy$: Subject<void> = new Subject();
  pdfSavedName: string = 'Discounts Granted Analysis.pdf';

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
  ) {
    forkJoin([
      this.reportService.generateDiscountGrantedAnalysisPdfReport(input),
      this.http.get(this.logoUrl, { responseType: 'blob' }),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([subOrderList, logoBlob]) => {
        const reader = new FileReader();
        reader.readAsDataURL(logoBlob);
        reader.onloadend = () => {
          const logoBase64 = reader.result as string;
          this.generateSalesVarianceBySalesRepPdf(
            subOrderList,
            logoBase64,
            stores,
            firstColumnDateRange,
            secondColumnDateRange,
          );
        };
      });
  }

  private generateSalesVarianceBySalesRepPdf(
    subOrders: SubOrderControlListDto[],
    logoBase64: string,
    stores: string[],
    firstColumnDateRange: DateRangeType,
    secondColumnDateRange: DateRangeType,
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

    const detailsReportBody = this.getDiscountAnalysisReportBody(
      subOrders,
      firstColumnDateRange,
      secondColumnDateRange,
    );

    if (!detailsReportBody || detailsReportBody.length === 0) {
      this.toasterService.warn('::CustomerProductAnalysisReport:NotFound');
      return;
    }

    const grandTotalsRow = this.calculateGrandTotals(detailsReportBody);
    const columnHeight = stores.length > 3 ? 75 : 70;
    autoTable(doc, {
      startY: columnHeight,
      head: [
        [
          this.localizationService.instant('::Reports:ProductSalesComparisons:DiscountCode'),
          this.localizationService.instant('::Reports:ProductSalesComparisons:DiscountDescription'),
          this.localizationService.instant('::DiscountAnalysisReport:DiscountAmount'),
          this.localizationService.instant('::Reports:ProductSalesComparisons:Units'),
          this.localizationService.instant('::Reports:ProductSalesComparisons:Avg'),
          this.localizationService.instant('::DiscountAnalysisReport:DiscountAmount'),
          this.localizationService.instant('::Reports:ProductSalesComparisons:Units'),
          this.localizationService.instant('::Reports:ProductSalesComparisons:Avg'),
          this.localizationService.instant('::DiscountAnalysisReport:DiscountDevAmount'),
          this.localizationService.instant('::Reports:ProductSalesComparisons:Units'),
          this.localizationService.instant('::Reports:ProductSalesComparisons:Dev'),
        ],
      ],
      body: [...detailsReportBody, grandTotalsRow],
      didDrawPage: data => {
        this.addPageHeader(
          doc,
          logoBase64,
          currentTime,
          data.pageNumber,
          this.localizationService.instant('::Menu:DiscountGrantedAnalysisReport'),
        );
        const filterBody = this.getFilterTableBody(
          stores,
          firstColumnDateRange,
          secondColumnDateRange,
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
      grandAmt2 = 0;
    let grandUnits1 = 0,
      grandUnits2 = 0;

    detailsReportBody.forEach(row => {
      const amt1 = parseFloat(row[2].replace('$', '')) || 0;
      const amt2 = parseFloat(row[5].replace('$', '')) || 0;

      const unit1 = parseInt(row[3], 10) || 0;
      const unit2 = parseInt(row[6], 10) || 0;

      grandAmt1 += amt1;
      grandUnits1 += unit1;
      grandAmt2 += amt2;
      grandUnits2 += unit2;
    });

    const grandAvg1 = grandUnits1 > 0 ? (grandAmt1 / grandUnits1).toFixed(2) : '0';
    const grandAvg2 = grandUnits2 > 0 ? (grandAmt2 / grandUnits2).toFixed(2) : '0';

    let discountDevAmt = Math.abs(grandAmt1 - grandAmt2).toFixed(2);
    let unitsDev = Math.abs(grandUnits1 - grandUnits2).toString();

    if (grandAmt1 - grandAmt2 < 0) discountDevAmt += '-';
    if (grandUnits1 - grandUnits2 < 0) unitsDev += '-';

    let devPercentage = grandAmt1 !== 0 ? ((grandAmt1 - grandAmt2) / grandAmt1) * 100 : 0;
    let formattedDevPercentage = `${Math.abs(devPercentage).toFixed(1)}%`;
    if (devPercentage < 0) {
      formattedDevPercentage += '-';
    }

    return [
      this.localizationService.instant('::DiscountAnalysisReport:LocTotal'),
      '',
      `$${grandAmt1.toFixed(2)}`,
      grandUnits1.toString(),
      `$${grandAvg1}`,
      `$${grandAmt2.toFixed(2)}`,
      grandUnits2.toString(),
      `$${grandAvg2}`,
      `$${discountDevAmt}${discountDevAmt.startsWith('-') ? '-' : ''}`,
      `${unitsDev}`,
      formattedDevPercentage,
    ];
  }

  private getDiscountAnalysisReportBody(
    subOrders: SubOrderControlListDto[],
    firstColumnDateRange: DateRangeType,
    secondColumnDateRange: DateRangeType,
  ) {
    const dateRanges = [
      this.parseDateRange(firstColumnDateRange),
      this.parseDateRange(secondColumnDateRange),
    ];

    const filteredData = dateRanges.map(range => this.filterOrdersByDateRange(subOrders, range));
    const combinedData = this.combineDiscountData(filteredData);
    return combinedData;
  }

  private combineDiscountData(filteredData: SubOrderControlListDto[][]) {
    const finalGroupOrders = filteredData.reduce(
      (combined, currentRange, index) => {
        currentRange.forEach(order => {
          const key = order.discountId;

          if (!combined[key]) {
            combined[key] = {
              DiscountCode: order.discountCode,
              DiscountDescription: order.discountDescription,
              DiscountId: order.discountId,
              DiscountAmount: [0, 0],
              Units: [0, 0],
              DiscountDevAmt: '0',
              UnitsDev: 0,
              DevPercentage: '0%',
            };
          }

          combined[key].DiscountAmount[index] += order.discountAmount || 0;
          combined[key].Units[index] += 1;
        });

        return combined;
      },
      {} as Record<
        string,
        {
          DiscountCode: string;
          DiscountDescription: string;
          DiscountId: string;
          DiscountAmount: number[];
          Units: number[];
          DiscountDevAmt: string;
          UnitsDev: number;
          DevPercentage: string;
        }
      >,
    );

    return Object.values(finalGroupOrders).map(discount => {
      const row = [discount.DiscountCode, discount.DiscountDescription ?? '-'];

      for (let i = 0; i < 2; i++) {
        row.push(`$${discount.DiscountAmount[i].toFixed(2)}`);
        row.push(discount.Units[i].toString());
        row.push(
          discount.Units[i] > 0
            ? `$${(discount.DiscountAmount[i] / discount.Units[i]).toFixed(2)}`
            : '$0.00',
        );
      }

      let discountDev = discount.DiscountAmount[0] - discount.DiscountAmount[1];
      const discountDevAmt =
        discountDev >= 0 ? `$${discountDev.toFixed(2)}` : `$${Math.abs(discountDev).toFixed(2)}-`;

      const unitsDev = discount.Units[0] - discount.Units[1];
      const formattedUnitsDev = unitsDev >= 0 ? `${unitsDev}` : `${Math.abs(unitsDev)}-`;

      let devPercent =
        discount.DiscountAmount[0] !== 0
          ? ((discount.DiscountAmount[0] - discount.DiscountAmount[1]) /
              discount.DiscountAmount[0]) *
            100
          : 0;
      let formattedDevPercentage = `${Math.abs(devPercent).toFixed(1)}%`;
      if (devPercent < 0) {
        formattedDevPercentage += '-';
      }

      row.push(discountDevAmt, formattedUnitsDev, formattedDevPercentage);

      return row;
    });
  }

  private filterOrdersByDateRange(subOrders: SubOrderControlListDto[], dateRange: ParsedDateRange) {
    return subOrders.filter(({ deliveredDate }) => {
      if (!deliveredDate) return false;

      const deliveryDate = new Date(deliveredDate);
      const fromDate = new Date(dateRange.from.setHours(0, 0, 0, 0));
      const toDate = new Date(dateRange.to.setHours(23, 59, 59, 999));

      return deliveryDate >= fromDate && deliveryDate < toDate;
    });
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
  ): FilterTableBody {
    const allSelectionText = this.localizationService.instant(
      '::Reports:OrderReport:Filter:AllSelect',
    );
    const firstFromDate = this.formatDate(firstColumnDateRange.fromDate);
    const firstToDate = this.formatDate(firstColumnDateRange.toDate);
    const secondFromDate = this.formatDate(secondColumnDateRange.fromDate);
    const secondToDate = this.formatDate(secondColumnDateRange.toDate);

    const storeNames =
      stores.length > 0 ? formatInputFilterListWithOthers(stores) : allSelectionText;
    const firstSelectedDateInfo =
      firstFromDate && firstToDate ? `${firstFromDate} To ${firstToDate}` : '';
    const secondSelectedDateInfo =
      secondFromDate && secondToDate ? `${secondFromDate} To ${secondToDate}` : '';

    return [
      [
        this.localizationService.instant('::SalesVarianceBySalesRepReport:DateColumn1') + ':',
        firstSelectedDateInfo,
        this.localizationService.instant('::SalesVarianceBySalesRepReport:DateColumn2') + ':',
        secondSelectedDateInfo,
      ],
      [this.localizationService.instant('::Menu:Stores') + ':', storeNames],
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

  private parseDateRange(range: DateRangeType): ParsedDateRange {
    return {
      from: new Date(range.fromDate),
      to: new Date(range.toDate),
    };
  }

  private formatDate = (date: string | Date | null | undefined): string =>
    date ? new Date(date).toLocaleDateString() : '';

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
