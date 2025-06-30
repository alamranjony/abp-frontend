import { Component, OnInit } from '@angular/core';
import {
  FilterPagedAndSortedOrderControlListResultRequestDto,
  OrderType,
  orderTypeOptions,
} from '@proxy/orders';
import { ReportFilterConfigDto } from 'src/app/models/report-filter-config-dto';
import { ReportFilterDto } from 'src/app/models/report-filter-dto';
import { StoreSalesAnalysisReportService } from 'src/app/services/store-sales-analysis-report.service';

@Component({
  selector: 'app-store-sales-analysis-report',
  templateUrl: './store-sales-analysis-report.component.html',
  styleUrl: './store-sales-analysis-report.component.scss',
})
export class StoreSalesAnalysisReportComponent implements OnInit {
  reportFilterConfig: ReportFilterConfigDto;

  orderTypes = orderTypeOptions.filter(c => [OrderType.WI, OrderType.WO].includes(c.value));

  constructor(private storeSalesAnalysisReportService: StoreSalesAnalysisReportService) {}

  ngOnInit(): void {
    this.reportFilterConfig = {
      hasSingleDate: true,
      hasStores: true,
      hasOrderType: true,
    } as ReportFilterConfigDto;
  }

  onReportGenerate(filters: ReportFilterDto) {
    if (!filters) return;

    const input = {
      stores: filters.storeIds,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      orderTypes: filters.orderTypeIds,
    } as FilterPagedAndSortedOrderControlListResultRequestDto;

    this.storeSalesAnalysisReportService.generateReport(
      input,
      filters.storeNames,
      filters.orderTypeNames,
    );
  }
}
