import { Component, OnInit } from '@angular/core';
import { FilterPagedAndSortedOrderControlListResultRequestDto } from '@proxy/orders';
import { ReportCategory } from '@proxy/reports';
import { ReportFilterConfigDto } from 'src/app/models/report-filter-config-dto';
import { ReportFilterDto } from 'src/app/models/report-filter-dto';
import { SalesmanGrossMarginAnalysisReportService } from 'src/app/services/salesman-gross-margin-analysis-report.service';

@Component({
  selector: 'app-salesman-gross-margin-analysis-report',
  templateUrl: './salesman-gross-margin-analysis-report.component.html',
  styleUrl: './salesman-gross-margin-analysis-report.component.scss',
})
export class SalesmanGrossMarginAnalysisReportComponent implements OnInit {
  reportFilterConfig: ReportFilterConfigDto;

  constructor(
    private salesmanGrossMarginAnalysisReportService: SalesmanGrossMarginAnalysisReportService,
  ) {}

  ngOnInit(): void {
    this.reportFilterConfig = {
      hasSingleDate: true,
      hasCustomers: true,
      hasSalesPerson: true,
      hasProductTypes: true,
      hasProductDepartments: true,
      hasOverallTotalsOnly: true,
      hasGMPercentageRange: true,
    } as ReportFilterConfigDto;
  }

  onReportGenerate(filters: ReportFilterDto) {
    if (!filters) return;

    const input = {
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      reportCategory: filters.isPrintByTypeOnly ? ReportCategory.Summary : ReportCategory.Details,
      customers: filters.customerIds,
      salesPersonIds: filters.salesPersonIds,
      productTypes: filters.productTypeIds,
      productDepartments: filters.productDepartmentIds,
      minGMPercentageRange: filters.minRange,
      maxGMPercentageRange: filters.maxRange,
    } as FilterPagedAndSortedOrderControlListResultRequestDto;

    this.salesmanGrossMarginAnalysisReportService.generateReport(
      input,
      filters.customerNames,
      filters.salesPersonNames,
      filters.productTypeNames,
      filters.productDepartmentNames,
      filters.isOverallTotalsOnly,
      filters.isPrintByTypeOnly,
      filters.minRange,
      filters.maxRange,
    );
  }
}
