import { Component, OnInit } from '@angular/core';
import { FilterPagedAndSortedOrderControlListResultRequestDto } from '@proxy/orders';
import { ReportFilterConfigDto } from 'src/app/models/report-filter-config-dto';
import { ReportFilterDto } from 'src/app/models/report-filter-dto';
import { CustomerProductAnalysisReportService } from 'src/app/services/customer-product-analysis-report.service';

@Component({
  selector: 'app-customer-product-analysis-report',
  templateUrl: './customer-product-analysis-report.component.html',
  styleUrl: './customer-product-analysis-report.component.scss',
})
export class CustomerProductAnalysisReportComponent implements OnInit {
  reportFilterConfig: ReportFilterConfigDto;

  constructor(private customerProductAnalysisReportService: CustomerProductAnalysisReportService) {}

  ngOnInit(): void {
    this.reportFilterConfig = {
      hasSingleDate: true,
      hasProductDepartments: true,
      hasStores: true,
      hasProducts: true,
      hasCustomers: true,
      hasProductTypes: true,
      hasIncludePrice: true,
      hasReportTitle: true,
      hasSalesPerson: true,
    } as ReportFilterConfigDto;
  }

  onReportGenerate(filters: ReportFilterDto) {
    if (!filters) return;

    const input = {
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      productIds: filters.productIds,
      productDepartments: filters.productDepartmentIds,
      stores: filters.storeIds,
      productTypes: filters.productTypeIds,
      customers: filters.customerIds,
      salesPersonIds: filters.salesPersonIds,
    } as FilterPagedAndSortedOrderControlListResultRequestDto;

    const reportTitle = filters.reportTitle ? `${filters.reportTitle}.pdf` : '';

    this.customerProductAnalysisReportService.generateReport(
      input,
      filters.customerNames,
      filters.storeNames,
      filters.productTypeNames,
      filters.productDepartmentNames,
      filters.productNames,
      filters.salesPersonNames,
      reportTitle,
      filters.isIncludePrice,
    );
  }
}
