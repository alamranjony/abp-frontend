import { Injectable, OnDestroy } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ToasterService } from '@abp/ng.theme.shared';
import {
  BusinessAnalysisReportCategory,
  businessAnalysisReportCategoryOptions,
  InputFilterDto,
  ReportService,
} from '@proxy/reports';
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
import { DeliveryCategory, OrderType, SubOrderControlListDto } from '@proxy/orders';
import { formatInputFilterListWithOthers } from './reports-utils';
import { ProductCategoryType } from '@proxy/products';
import { PaymentMethod } from '@proxy/payment';
import { OccasionCode } from '@proxy/recipients';

type FilterRow = [string, string] | [string, string, string, string];
type FilterTableBody = FilterRow[];
type ParsedDateRange = { from: Date; to: Date };
type OrderTotals = {
  subtotal: number;
  quantity: number;
};
type BusinessAnalysisReportRow = [string, string, string, string, string, string, string];

@Injectable({
  providedIn: 'root',
})
export class BusinessAnalysisReportService implements OnDestroy {
  private readonly logoUrl = 'assets/images/logo/ffc-logo.jpg';
  destroy$: Subject<void> = new Subject();
  pdfSavedName: string = 'Business Analysis.pdf';
  businessAnalysisCategory = businessAnalysisReportCategoryOptions;

  constructor(
    private http: HttpClient,
    private toasterService: ToasterService,
    private reportService: ReportService,
    private localizationService: LocalizationService,
  ) {}

  generateReport(
    input: InputFilterDto,
    stores: string[],
    firstComparisonDateRange: DateRangeType,
    secondComparisonDateRange: DateRangeType,
  ) {
    forkJoin([
      this.reportService.generateBusinessAnalysisPdfReport(input),
      this.http.get(this.logoUrl, { responseType: 'blob' }),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([subOrderList, logoBlob]) => {
        const reader = new FileReader();
        reader.readAsDataURL(logoBlob);
        reader.onloadend = () => {
          const logoBase64 = reader.result as string;
          this.generateBusinessAnalysisReportPdf(
            subOrderList,
            logoBase64,
            stores,
            firstComparisonDateRange,
            secondComparisonDateRange,
          );
        };
      });
  }

  private generateBusinessAnalysisReportPdf(
    subOrders: SubOrderControlListDto[],
    logoBase64: string,
    stores: string[],
    firstComparisonDateRange: DateRangeType,
    secondComparisonDateRange: DateRangeType,
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

    const detailsReportBody = this.getBusinessAnalysisReportBody(
      subOrders,
      firstComparisonDateRange,
      secondComparisonDateRange,
    );

    if (!detailsReportBody || detailsReportBody.length === 0) {
      this.toasterService.warn('::CustomerProductAnalysisReport:NotFound');
      return;
    }

    const columnHeight = stores.length > 3 ? 75 : 70;
    autoTable(doc, {
      startY: columnHeight,
      head: [
        [
          this.localizationService.instant('::BusinessAnalysisReport:Business'),
          this.localizationService.instant('::BusinessAnalysisReport:Performance'),
          this.localizationService.instant('::BusinessAnalysisReport:Results'),
          this.localizationService.instant('::BusinessAnalysisReport:DollarAmt'),
          this.localizationService.instant('::Reports:ProductSalesComparisons:Units'),
          this.localizationService.instant('::BusinessAnalysisReport:DollarAmt'),
          this.localizationService.instant('::Reports:ProductSalesComparisons:Units'),
        ],
      ],
      body: [...detailsReportBody],
      didDrawPage: data => {
        this.addPageHeader(
          doc,
          logoBase64,
          currentTime,
          data.pageNumber,
          this.localizationService.instant('::BusinessAnalysisReport:Title'),
        );
        const filterBody = this.getFilterTableBody(
          stores,
          firstComparisonDateRange,
          secondComparisonDateRange,
        );
        this.addFilterTable(doc, filterBody);
      },
      headStyles: {
        font: REPORT_FONT_NAME,
        fontStyle: REPORT_FONT_TYPE,
        fillColor: REPORT_HEADER_BACKGROUND_COLOR,
        textColor: REPORT_HEADER_TEXT_COLOR,
      },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 25 },
        2: { cellWidth: 55 },
        3: { cellWidth: 35 },
        4: { cellWidth: 25 },
        5: { cellWidth: 35 },
        6: { cellWidth: 25 },
      },
      bodyStyles: {
        font: REPORT_FONT_NAME,
        fontStyle: REPORT_FONT_TYPE,
      },
      margin: { top: 80, left: 28 },
    });

    doc.save(this.pdfSavedName);
  }

  private getBusinessAnalysisReportBody(
    subOrders: SubOrderControlListDto[],
    firstComparisonDateRange: DateRangeType,
    secondComparisonDateRange: DateRangeType,
  ) {
    const dateRanges = [
      this.parseDateRange(firstComparisonDateRange),
      this.parseDateRange(secondComparisonDateRange),
    ];

    const filteredData = dateRanges.map(range => this.filterSubOrdersByDateRange(subOrders, range));
    const combinedData = this.combineBusinessAnalysisData(filteredData);
    return combinedData;
  }

  private combineBusinessAnalysisData(
    filteredData: SubOrderControlListDto[][],
  ): BusinessAnalysisReportRow[] {
    const [firstDateRangeData, secondDateRangeData] = filteredData;
    const result: BusinessAnalysisReportRow[] = [];

    Object.keys(BusinessAnalysisReportCategory)
      .filter(key => !isNaN(Number(BusinessAnalysisReportCategory[key as any])))
      .forEach(key => {
        const categoryKey = key as keyof typeof BusinessAnalysisReportCategory;
        const categoryValue = BusinessAnalysisReportCategory[categoryKey];

        switch (categoryValue) {
          case BusinessAnalysisReportCategory.MerchandiseSales:
            const firstTotals = this.calculateTotalsByFilter(
              firstDateRangeData,
              item => item.productCategoryType === ProductCategoryType.Flower,
            );
            const secondTotals = this.calculateTotalsByFilter(
              secondDateRangeData,
              item => item.productCategoryType === ProductCategoryType.Flower,
            );
            result.push(
              this.generateStandardRow(
                '::BusinessAnalysisReport:MerchandiseSales',
                firstTotals,
                secondTotals,
              ),
            );
            break;
          case BusinessAnalysisReportCategory.CashSales: {
            const firstTotals = this.calculateTotalsByFilter(
              firstDateRangeData,
              item => item.paymentMethod === PaymentMethod.Cash,
            );
            const secondTotals = this.calculateTotalsByFilter(
              secondDateRangeData,
              item => item.paymentMethod === PaymentMethod.Cash,
            );
            result.push(
              this.generateStandardRow(
                '::BusinessAnalysisReport:CashSales',
                firstTotals,
                secondTotals,
              ),
            );
            break;
          }
          case BusinessAnalysisReportCategory.CreditCardSales: {
            const firstTotals = this.calculateTotalsByFilter(
              firstDateRangeData,
              item => item.paymentMethod === PaymentMethod.Card,
            );
            const secondTotals = this.calculateTotalsByFilter(
              secondDateRangeData,
              item => item.paymentMethod === PaymentMethod.Card,
            );
            result.push(
              this.generateStandardRow(
                '::BusinessAnalysisReport:CreditCardSales',
                firstTotals,
                secondTotals,
              ),
            );
            break;
          }
          case BusinessAnalysisReportCategory.WireInSales: {
            const firstTotals = this.calculateTotalsByFilter(
              firstDateRangeData,
              item => item.orderType === OrderType.WI,
            );
            const secondTotals = this.calculateTotalsByFilter(
              secondDateRangeData,
              item => item.orderType === OrderType.WI,
            );
            result.push(
              this.generateStandardRow(
                '::BusinessAnalysisReport:WireInSales',
                firstTotals,
                secondTotals,
              ),
            );
            break;
          }
          case BusinessAnalysisReportCategory.WireOutSales: {
            const firstTotals = this.calculateTotalsByFilter(
              firstDateRangeData,
              item => item.orderType === OrderType.WO,
            );
            const secondTotals = this.calculateTotalsByFilter(
              secondDateRangeData,
              item => item.orderType === OrderType.WO,
            );
            result.push(
              this.generateStandardRow(
                '::BusinessAnalysisReport:WireOutSales',
                firstTotals,
                secondTotals,
              ),
            );
            break;
          }
          case BusinessAnalysisReportCategory.NoOfPhoneOrders: {
            const firstTotals = this.calculateTotalsByFilter(
              firstDateRangeData,
              item => item.orderType === OrderType.PHO,
            );
            const secondTotals = this.calculateTotalsByFilter(
              secondDateRangeData,
              item => item.orderType === OrderType.PHO,
            );
            result.push(
              this.generateStandardRow(
                '::BusinessAnalysisReport:NoOfPhoneOrders',
                firstTotals,
                secondTotals,
              ),
            );
            break;
          }
          case BusinessAnalysisReportCategory.CarryOutSales: {
            const firstTotals = this.calculateTotalsByFilter(
              firstDateRangeData,
              item => item.deliveryCategory === DeliveryCategory.CarryOut,
            );
            const secondTotals = this.calculateTotalsByFilter(
              secondDateRangeData,
              item => item.deliveryCategory === DeliveryCategory.CarryOut,
            );
            result.push(
              this.generateStandardRow(
                '::BusinessAnalysisReport:CarryOutSales',
                firstTotals,
                secondTotals,
              ),
            );
            break;
          }
          case BusinessAnalysisReportCategory.NoOfWalkInOrders: {
            const firstTotals = this.calculateTotalsByFilter(
              firstDateRangeData,
              item => item.orderType === OrderType.SW,
            );
            const secondTotals = this.calculateTotalsByFilter(
              secondDateRangeData,
              item => item.orderType === OrderType.SW,
            );
            result.push(
              this.generateStandardRow(
                '::BusinessAnalysisReport:NoOfWalkInOrders',
                firstTotals,
                secondTotals,
              ),
            );
            break;
          }
          case BusinessAnalysisReportCategory.WeddingOrders: {
            const firstTotals = this.calculateTotalsByFilter(
              firstDateRangeData,
              item => item.occasionCode === OccasionCode.Wedding,
            );
            const secondTotals = this.calculateTotalsByFilter(
              secondDateRangeData,
              item => item.occasionCode === OccasionCode.Wedding,
            );
            result.push(
              this.generateStandardRow(
                '::BusinessAnalysisReport:WeddingOrders',
                firstTotals,
                secondTotals,
              ),
            );
            break;
          }
          case BusinessAnalysisReportCategory.NoOfOrders: {
            const firstCount = this.countDistinctSubOrders(firstDateRangeData);
            const secondCount = this.countDistinctSubOrders(secondDateRangeData);
            result.push(this.generateNoOfOrdersRow(firstCount, secondCount));
            break;
          }
          case BusinessAnalysisReportCategory.AverageSale: {
            const firstCount = this.calculateTotalsByFilter(firstDateRangeData, item => true);
            const secondCount = this.calculateTotalsByFilter(secondDateRangeData, item => true);
            result.push(this.generateAverageSaleRow(firstCount, secondCount));
            break;
          }
          case BusinessAnalysisReportCategory.AverageNoOfSales: {
            const firstAverage = this.calculateAvgNoOfSalesPerHour(firstDateRangeData);
            const secondAverage = this.calculateAvgNoOfSalesPerHour(secondDateRangeData);
            result.push(this.generateAvgNoOfSalesRow(firstAverage, secondAverage));
            break;
          }
          default:
            break;
        }
      });

    return result;
  }

  private calculateTotalsByFilter(
    data: SubOrderControlListDto[],
    filter: (item: SubOrderControlListDto) => boolean,
  ): OrderTotals {
    return data.reduce(
      (totals, item) => {
        if (item.orderId && filter(item)) {
          totals.subtotal += item.subTotal;
          totals.quantity += item.quantity;
        }
        return totals;
      },
      { subtotal: 0, quantity: 0 },
    );
  }

  private calculateAvgNoOfSalesPerHour(data: SubOrderControlListDto[]): number {
    const salesPerDay = new Map<string, number>();

    data.forEach(item => {
      if (item.orderDate) {
        const dateKey = new Date(item.orderDate).toISOString().split('T')[0];
        if (!salesPerDay.has(dateKey)) {
          salesPerDay.set(dateKey, 0);
        }
        salesPerDay.set(dateKey, salesPerDay.get(dateKey)! + 1);
      }
    });
    const totalSales = Array.from(salesPerDay.values()).reduce((sum, count) => sum + count, 0);
    const totalDays = salesPerDay.size;

    if (totalDays === 0) {
      return 0;
    }

    const avgSalesPerHour = totalSales / (totalDays * 8);

    return avgSalesPerHour;
  }

  private generateStandardRow(
    labelKey: string,
    firstTotals: OrderTotals,
    secondTotals: OrderTotals,
  ): BusinessAnalysisReportRow {
    const dollarAmt1 = firstTotals.subtotal;
    const units1 = firstTotals.quantity;

    const dollarAmt2 = secondTotals.subtotal;
    const units2 = secondTotals.quantity;

    const isDown = dollarAmt2 > dollarAmt1;
    const performance = isDown
      ? this.localizationService.instant('::BusinessAnalysisReport:AreDown')
      : dollarAmt2 === dollarAmt1
        ? this.localizationService.instant('::BusinessAnalysisReport:AreFlat')
        : this.localizationService.instant('::BusinessAnalysisReport:AreUp');

    const dollarDifference = Math.abs(dollarAmt1 - dollarAmt2);
    const percentageChange = dollarAmt1 === 0 ? 0 : ((dollarAmt1 - dollarAmt2) / dollarAmt1) * 100;

    const formattedPercentage = `${percentageChange.toFixed(1)}%`;
    const formattedDollarDiff = ` $${dollarDifference.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}${isDown ? '-' : ''}`;

    return [
      this.localizationService.instant(labelKey),
      this.checkPerformance(performance, dollarAmt1, dollarAmt2),
      `${formattedPercentage} ${formattedDollarDiff}`,
      dollarAmt1.toLocaleString(undefined, { minimumFractionDigits: 2 }),
      units1.toLocaleString(),
      dollarAmt2.toLocaleString(undefined, { minimumFractionDigits: 2 }),
      units2.toLocaleString(),
    ];
  }

  private checkPerformance(performance: string, amount1: number, amount2: number): string {
    if (amount1 === 0 && amount2 === 0) return '';
    else return performance;
  }

  private generateAverageSaleRow(
    firstTotals: OrderTotals,
    secondTotals: OrderTotals,
  ): BusinessAnalysisReportRow {
    const average1 = firstTotals.quantity === 0 ? 0 : firstTotals.subtotal / firstTotals.quantity;
    const average2 =
      secondTotals.quantity === 0 ? 0 : secondTotals.subtotal / secondTotals.quantity;

    const isDown = average2 < average1;
    const performance = isDown
      ? this.localizationService.instant('::BusinessAnalysisReport:IsDown')
      : average1 === average2
        ? this.localizationService.instant('::BusinessAnalysisReport:IsFlat')
        : this.localizationService.instant('::BusinessAnalysisReport:IsUp');

    const difference = Math.abs(average1 - average2);
    const resultText = `$${average2.toFixed(2)}, $${difference.toFixed(2)} from $${average1.toFixed(2)}`;

    return [
      this.localizationService.instant('::BusinessAnalysisReport:AverageSale'),
      this.checkPerformance(performance, average1, average2),
      resultText,
      '',
      '',
      '',
      '',
    ];
  }

  private generateAvgNoOfSalesRow(
    firstAvgSalesPerHour: number,
    secondAvgSalesPerHour: number,
  ): BusinessAnalysisReportRow {
    const isDown = secondAvgSalesPerHour < firstAvgSalesPerHour;
    const performance = isDown
      ? this.localizationService.instant('::BusinessAnalysisReport:IsDown')
      : this.localizationService.instant('::BusinessAnalysisReport:IsUp');

    const difference = Math.abs(firstAvgSalesPerHour - secondAvgSalesPerHour);
    const percentageChange =
      firstAvgSalesPerHour === 0
        ? 0
        : ((firstAvgSalesPerHour - secondAvgSalesPerHour) / firstAvgSalesPerHour) * 100;

    const resultText = `${percentageChange.toFixed(1)}%  ${difference.toFixed(1)}`;

    return [
      this.localizationService.instant('::BusinessAnalysisReport:AvgNoOfSalesPerHour'),
      this.checkPerformance(performance, firstAvgSalesPerHour, secondAvgSalesPerHour),
      resultText,
      firstAvgSalesPerHour.toFixed(2),
      '',
      secondAvgSalesPerHour.toFixed(2),
      '',
    ];
  }

  private generateNoOfOrdersRow(
    firstOrderCount: number,
    secondOrderCount: number,
  ): BusinessAnalysisReportRow {
    const isDown = secondOrderCount > firstOrderCount;
    const performance = isDown
      ? this.localizationService.instant('::BusinessAnalysisReport:AreDown')
      : this.localizationService.instant('::BusinessAnalysisReport:AreUp');

    const orderDifference = Math.abs(firstOrderCount - secondOrderCount);
    const percentageChange =
      firstOrderCount === 0 ? 0 : ((firstOrderCount - secondOrderCount) / firstOrderCount) * 100;

    const formattedPercentage = `${percentageChange.toFixed(1)} %`;
    const formattedOrderDiff = ` ${orderDifference}${isDown ? '-' : ''}`;

    return [
      this.localizationService.instant('::BusinessAnalysisReport:NoOfOrders'),
      this.checkPerformance(performance, firstOrderCount, secondOrderCount),
      `${formattedPercentage} ${formattedOrderDiff}`,
      '',
      '',
      '',
      '',
    ];
  }

  private countDistinctSubOrders(data: SubOrderControlListDto[]): number {
    const uniqueOrderIds = new Set<string>();
    data.forEach(item => {
      if (item.orderId) {
        uniqueOrderIds.add(item.subOrderId);
      }
    });
    return uniqueOrderIds.size;
  }

  private filterSubOrdersByDateRange(
    subOrders: SubOrderControlListDto[],
    dateRange: ParsedDateRange,
  ) {
    return subOrders.filter(({ orderDate }) => {
      if (!orderDate) return false;

      const orderedDate = new Date(orderDate);
      const fromDate = new Date(dateRange.from.setHours(0, 0, 0, 0));
      const toDate = new Date(dateRange.to.setHours(23, 59, 59, 999));

      return orderedDate >= fromDate && orderedDate < toDate;
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
    firstComparisonDateRange: DateRangeType,
    secondComparisonDateRange: DateRangeType,
  ): FilterTableBody {
    const allSelectionText = this.localizationService.instant(
      '::Reports:OrderReport:Filter:AllSelect',
    );
    const firstFromDate = this.formatDate(firstComparisonDateRange.fromDate);
    const firstToDate = this.formatDate(firstComparisonDateRange.toDate);
    const secondFromDate = this.formatDate(secondComparisonDateRange.fromDate);
    const secondToDate = this.formatDate(secondComparisonDateRange.toDate);

    const storeNames =
      stores.length > 0 ? formatInputFilterListWithOthers(stores) : allSelectionText;
    const firstSelectedDateInfo =
      firstFromDate && firstToDate ? `${firstFromDate} To ${firstToDate}` : '';
    const secondSelectedDateInfo =
      secondFromDate && secondToDate ? `${secondFromDate} To ${secondToDate}` : '';

    return [
      [
        this.localizationService.instant('::BusinessAnalysisReport:FirstComparison') + ':',
        firstSelectedDateInfo,
        this.localizationService.instant('::BusinessAnalysisReport:SecondComparison') + ':',
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
