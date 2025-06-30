import { Component, OnInit } from '@angular/core';
import { FilterPagedAndSortedOrderControlListResultRequestDto } from '@proxy/orders';
import { ReportFilterConfigDto } from 'src/app/models/report-filter-config-dto';
import { ReportFilterDto } from 'src/app/models/report-filter-dto';
import { ProductSalesComparisonsReportService } from 'src/app/services/product-sales-comparisons-report.service';

@Component({
  selector: 'app-product-sales-comparisons-report',
  templateUrl: './product-sales-comparisons-report.component.html',
  styleUrl: './product-sales-comparisons-report.component.scss',
})
export class ProductSalesComparisonsReportComponent implements OnInit {
  reportFilterConfig: ReportFilterConfigDto;

  constructor(private productSalesComparisonsReportService: ProductSalesComparisonsReportService) {}

  ngOnInit(): void {
    this.reportFilterConfig = {
      hasDateRange: true,
      hasProductTypes: true,
      hasProductDepartments: true,
      hasStores: true,
      hasProducts: true,
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
    } as FilterPagedAndSortedOrderControlListResultRequestDto;

    this.productSalesComparisonsReportService.generateReport(
      input,
      filters.firstDateRange,
      filters.secondDateRange,
      filters.storeNames,
      filters.productNames,
      filters.productDepartmentNames,
      filters.productTypeNames,
    );
  }
}
