import { Component, OnInit } from '@angular/core';
import { FilterPagedAndSortedOrderControlListResultRequestDto } from '@proxy/orders';
import { ReportFilterConfigDto } from 'src/app/models/report-filter-config-dto';
import { ReportFilterDto } from 'src/app/models/report-filter-dto';
import { ProductSalesComparisonByCustomersReportService } from 'src/app/services/product-sales-comparison-by-customers-report.service';

@Component({
  selector: 'app-product-sales-comparison-by-customers-report',
  templateUrl: './product-sales-comparison-by-customers-report.component.html',
  styleUrl: './product-sales-comparison-by-customers-report.component.scss',
})
export class ProductSalesComparisonByCustomerReportComponent implements OnInit {
  reportFilterConfig: ReportFilterConfigDto;
  constructor(
    private productSalesComparisonByCustomersReportService: ProductSalesComparisonByCustomersReportService,
  ) {}

  ngOnInit(): void {
    this.reportFilterConfig = {
      hasDateRange: true,
      hasCustomerClass: true,
      hasStores: true,
      hasProductTypes: true,
      hasProductDepartments: true,
      hasProducts: true,
      hasReportCategory: true,
    } as ReportFilterConfigDto;
  }

  onReportGenerate(filters: ReportFilterDto) {
    const input = {
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      customerClassList: filters.selectedCustomerClassIds,
      productTypes: filters.productTypeIds,
      productDepartments: filters.productDepartmentIds,
      productIds: filters.productIds,
      stores: filters.storeIds,
      reportCategory: filters.reportCategory,
    } as FilterPagedAndSortedOrderControlListResultRequestDto;

    this.productSalesComparisonByCustomersReportService.generateReport(
      input,
      filters.firstDateRange,
      filters.secondDateRange,
      filters.selectedCustomerClassNames,
      filters.storeNames,
      filters.productNames,
      filters.productDepartmentNames,
      filters.productTypeNames,
      filters.reportCategory,
    );
  }
}
