import { Component, OnInit } from '@angular/core';
import { InputFilterDto } from '@proxy/reports';
import { ReportFilterConfigDto } from 'src/app/models/report-filter-config-dto';
import { ReportFilterDto } from 'src/app/models/report-filter-dto';
import { BusinessAnalysisReportService } from 'src/app/services/reports/business-analysis-report.service';

@Component({
  selector: 'app-business-analysis-report',
  templateUrl: './business-analysis-report.component.html',
  styleUrl: './business-analysis-report.component.scss',
})
export class BusinessAnalysisReportComponent implements OnInit {
  reportFilterConfig: ReportFilterConfigDto;

  constructor(private businessAnalysisReportService: BusinessAnalysisReportService) {}

  ngOnInit(): void {
    this.reportFilterConfig = {
      hasDateRange: true,
      hasStores: true,
    } as ReportFilterConfigDto;
  }

  onReportGenerate(filters: ReportFilterDto) {
    if (!filters) return;

    const input = {
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      stores: filters.storeIds,
    } as InputFilterDto;

    this.businessAnalysisReportService.generateReport(
      input,
      filters.storeNames,
      filters.firstDateRange,
      filters.secondDateRange,
    );
  }
}
