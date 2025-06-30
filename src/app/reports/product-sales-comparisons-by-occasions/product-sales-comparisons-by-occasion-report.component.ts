import { Component, OnInit } from '@angular/core';
import { FilterPagedAndSortedOrderControlListResultRequestDto } from '@proxy/orders';
import { ReportFilterConfigDto } from 'src/app/models/report-filter-config-dto';
import { ReportFilterDto } from 'src/app/models/report-filter-dto';
import { ProductSalesComparisonsByOccasionReportService } from 'src/app/services/reports/product-sales-comparisons-by-occasion-report.service';

@Component({
  selector: 'app-product-sales-comparisons-by-occasion-report',
  templateUrl: './product-sales-comparisons-by-occasion-report.component.html',
  styleUrl: './product-sales-comparison-by-occasion-report.component.scss',
})
export class ProductSalesComparisonsByOccasionReportComponent implements OnInit {
  reportFilterConfig: ReportFilterConfigDto;
  constructor(
    private productSalesComparisonsByOccasionReportService: ProductSalesComparisonsByOccasionReportService,
  ) {}

  ngOnInit(): void {
    this.reportFilterConfig = {
      hasDateRange: true,
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
      productTypes: filters.productTypeIds,
      productDepartments: filters.productDepartmentIds,
      productIds: filters.productIds,
      stores: filters.storeIds,
      reportCategory: filters.reportCategory,
    } as FilterPagedAndSortedOrderControlListResultRequestDto;

    this.productSalesComparisonsByOccasionReportService.generateReport(
      input,
      filters.firstDateRange,
      filters.secondDateRange,
      filters.storeNames,
      filters.productNames,
      filters.productDepartmentNames,
      filters.productTypeNames,
      filters.reportCategory,
    );
  }
}
