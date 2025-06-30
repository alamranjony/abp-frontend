import { Component, OnInit } from '@angular/core';
import { FilterPagedAndSortedOrderControlListResultRequestDto } from '@proxy/orders';
import { ReportFilterConfigDto } from 'src/app/models/report-filter-config-dto';
import { ReportFilterDto } from 'src/app/models/report-filter-dto';
import { CancelledOrdersReportService } from 'src/app/services/reports/cancelled-orders-report.service';

@Component({
  selector: 'app-cancelled-orders-report',
  templateUrl: './cancelled-orders-report.component.html',
  styleUrl: './cancelled-orders-report.component.scss',
})
export class CancelledOrdersReportComponent implements OnInit {
  reportFilterConfig: ReportFilterConfigDto;

  constructor(private readonly cancelledOrderReportService: CancelledOrdersReportService) {}

  ngOnInit(): void {
    this.reportFilterConfig = {
      hasDateCriteria: true,
      hasSingleDate: true,
      hasOrderType: true,
      hasStores: true,
      hasCancellationReason: true,
    } as ReportFilterConfigDto;
  }

  onReportGenerate(filters: ReportFilterDto) {
    if (!filters) return;

    const input = {
      filterDateCategory: filters.filterDateCategory,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      stores: filters.storeIds,
      orderTypes: filters.orderTypeIds,
      cancellationReasonIds: filters.cancellationReasonIds,
    } as FilterPagedAndSortedOrderControlListResultRequestDto;

    this.cancelledOrderReportService.generateCancelledOrderReport(input, filters);
  }
}
