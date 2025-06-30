import { Component, OnInit } from '@angular/core';
import { FilterPagedAndSortedOrderControlListResultRequestDto } from '@proxy/orders';
import { ReportFilterConfigDto } from 'src/app/models/report-filter-config-dto';
import { ReportFilterDto } from 'src/app/models/report-filter-dto';
import { ProductTypeComparisonsReportService } from 'src/app/services/product-types-comparisons-report.service';

@Component({
  selector: 'app-product-type-comparisons-report',
  templateUrl: './product-type-comparisons-report.component.html',
  styleUrl: './product-type-comparisons-report.component.scss',
})
export class ProductTypeComparisonsReportComponent implements OnInit {
  reportFilterConfig: ReportFilterConfigDto;
  constructor(private productTypeComparisonsReportService: ProductTypeComparisonsReportService) {}

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

    this.productTypeComparisonsReportService.generateReport(
      input,
      filters.firstDateRange,
      filters.secondDateRange,
      filters.storeNames,
      filters.productTypeNames,
      filters.productDepartmentNames,
      filters.productNames,
      filters.reportCategory,
    );
  }
}
