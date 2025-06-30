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
import trebucFont from 'src/assets/fonts/trebuc-normal.js';
import {
  REPORT_FONT_FILE_NAME,
  REPORT_FONT_NAME,
  REPORT_FONT_TYPE,
  REPORT_HEADER_BACKGROUND_COLOR,
  REPORT_HEADER_TEXT_COLOR,
} from '../shared/constants';

@Injectable({
  providedIn: 'root',
})
export class ProductRankingReportService implements OnDestroy {
  private readonly logoUrl = 'assets/images/logo/ffc-logo.jpg';
  destroy$: Subject<void> = new Subject();

  constructor(
    private http: HttpClient,
    private toasterService: ToasterService,
    private orderService: OrderService,
    private readonly localizationService: LocalizationService,
  ) {}

  generateReport(input: FilterPagedAndSortedOrderControlListResultRequestDto) {
    forkJoin([
      this.orderService.generateProductRankingReport(input),
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
          this.generateProductRankingReportPdf(orders, logoBase64, input);
        };
      });
  }

  private generateProductRankingReportPdf(
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

    const reportBody = this.getReportBody(orders);
    this.addReportContents(doc, reportBody, logoBase64, currentTime, input);

    const fileName = this.localizationService.instant(
      '::Reports:ProductRankingReport:DownloadableFileName',
    );
    doc.save(fileName);
  }

  private addReportContents(
    doc: jsPDF,
    body: (string | number)[][],
    logoBase64: string,
    currentTime: string,
    input: FilterPagedAndSortedOrderControlListResultRequestDto,
  ) {
    const formattedBody = body.map(row => {
      return [row[0], row[1], row[2], `$${row[3]}`, `$${row[4]}`];
    });

    const productCodeColumnName = this.localizationService.instant(
      '::Reports:ProductRankingReport:ProductCode',
    );
    const ProductDescriptionColumnName = this.localizationService.instant(
      '::Reports:ProductRankingReport:ProductDescription',
    );
    const totalRankedUnitsColumnName = this.localizationService.instant(
      '::Reports:ProductRankingReport:TotalRankedUnits',
    );
    const totalRankedDollarsColumnName = this.localizationService.instant(
      '::Reports:ProductRankingReport:TotalRankedDollars',
    );
    const averageUnitPriceColumnName = this.localizationService.instant(
      '::Reports:ProductRankingReport:AverageUnitPrice',
    );
    const reportName = this.localizationService.instant(
      '::Reports:ProductRankingReport:ReportName',
    );

    autoTable(doc, {
      startY: 55,
      head: [
        [
          productCodeColumnName,
          ProductDescriptionColumnName,
          totalRankedUnitsColumnName,
          totalRankedDollarsColumnName,
          averageUnitPriceColumnName,
        ],
      ],
      body: formattedBody,
      didDrawPage: data => {
        this.addPageHeader(doc, logoBase64, currentTime, data.pageNumber, reportName, input);
      },
      margin: { top: 55 },
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
    input: FilterPagedAndSortedOrderControlListResultRequestDto,
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

    doc.setFontSize(12);
    const fromDate = input.fromDate ? new Date(input.fromDate).toLocaleDateString() : '';
    const toDate = input.toDate ? new Date(input.toDate).toLocaleDateString() : '';
    const selectedDateInfo = fromDate && toDate ? `${fromDate} To ${toDate}` : '';

    const dateFilterName = this.localizationService.instant('::Reports:ProductRankingReport:Date');

    doc.text(`${dateFilterName} ${selectedDateInfo}`, 14, 50);
  }

  private getReportBody(orders: SubOrderControlListDto[]) {
    return orders.map(order => [
      order.productCode,
      order.productDescription,
      order.totalUnits,
      order.totalUnitPrice,
      order.avgUnitPrice,
    ]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
