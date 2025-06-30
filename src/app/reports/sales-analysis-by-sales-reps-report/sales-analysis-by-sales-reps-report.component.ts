import { Component, OnInit } from '@angular/core';
import { FilterPagedAndSortedOrderControlListResultRequestDto } from '@proxy/orders';
import { ReportFilterConfigDto } from 'src/app/models/report-filter-config-dto';
import { ReportFilterDto } from 'src/app/models/report-filter-dto';
import { SalesAnalysisBySalesRepsReportService } from 'src/app/services/reports/sales-analysis-by-sales-reps-report.service';

@Component({
  selector: 'app-sales-analysis-by-sales-reps-report',
  templateUrl: './sales-analysis-by-sales-reps-report.component.html',
  styleUrl: './sales-analysis-by-sales-reps-report.component.scss',
})
export class SalesAnalysisBySalesRepsReportComponent implements OnInit {
  reportFilterConfig: ReportFilterConfigDto;

  constructor(
    private salesAnalysisBySalesRepsReportService: SalesAnalysisBySalesRepsReportService,
  ) {}

  ngOnInit(): void {
    this.reportFilterConfig = {
      hasSingleDate: true,
      hasSalesPerson: true,
      hasProducts: true,
    } as ReportFilterConfigDto;
  }

  onReportGenerate(filters: ReportFilterDto) {
    const input = {
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      salesPersonIds: filters.salesPersonIds,
      productIds: filters.productIds,
    } as FilterPagedAndSortedOrderControlListResultRequestDto;

    this.salesAnalysisBySalesRepsReportService.generateReport(
      input,
      filters.salesPersonNames,
      filters.productNames,
    );
  }
}
