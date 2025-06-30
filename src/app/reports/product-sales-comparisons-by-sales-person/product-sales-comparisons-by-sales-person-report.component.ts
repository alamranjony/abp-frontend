import { Component, OnInit } from '@angular/core';
import { FilterPagedAndSortedOrderControlListResultRequestDto } from '@proxy/orders';
import { ReportFilterConfigDto } from 'src/app/models/report-filter-config-dto';
import { ReportFilterDto } from 'src/app/models/report-filter-dto';
import { ProductSalesComparisonsBySalesPersonReportService } from 'src/app/services/product-sales-comparisons-by-sales-person-report.service';

@Component({
  selector: 'app-product-sales-comparisons-by-sales-person-report',
  templateUrl: './product-sales-comparisons-by-sales-person-report.component.html',
  styleUrl: './product-sales-comparisons-by-sales-person-report.component.scss',
})
export class ProductSalesComparisonsBySalesPersonReportComponent implements OnInit {
  reportFilterConfig: ReportFilterConfigDto;
  constructor(
    private productSalesComparisonsBySalesPersonReportService: ProductSalesComparisonsBySalesPersonReportService,
  ) {}

  ngOnInit(): void {
    this.reportFilterConfig = {
      hasDateRange: true,
      hasStores: true,
      hasProductTypes: true,
      hasProductDepartments: true,
      hasProducts: true,
      hasReportCategory: true,
      hasEmployeeClass: true,
    } as ReportFilterConfigDto;
  }

  onReportGenerate(filters: ReportFilterDto) {
    const input = {
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      productTypes: filters.productTypeIds,
      productDepartments: filters.productDepartmentIds,
      productIds: filters.productIds,
      stores: filters.storeIds,
      reportCategory: filters.reportCategory,
      employeeClassList: filters.employeeClassIds,
    } as FilterPagedAndSortedOrderControlListResultRequestDto;

    this.productSalesComparisonsBySalesPersonReportService.generateReport(
      input,
      filters.firstDateRange,
      filters.secondDateRange,
      filters.storeNames,
      filters.productNames,
      filters.productDepartmentNames,
      filters.productTypeNames,
      filters.reportCategory,
      filters.employeeClassNames,
    );
  }
}
