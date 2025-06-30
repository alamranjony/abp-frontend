import { Component, OnInit } from '@angular/core';
import { FilterPagedAndSortedOrderControlListResultRequestDto } from '@proxy/orders';
import { ReportFilterConfigDto } from 'src/app/models/report-filter-config-dto';
import { ReportFilterDto } from 'src/app/models/report-filter-dto';
import { ProductSalesByOrderPlacementReportService } from 'src/app/services/product-sales-by-order-placement-report.service';

@Component({
  selector: 'app-product-sales-by-order-placement-report',
  templateUrl: './product-sales-by-order-placement-report.component.html',
  styleUrl: './product-sales-by-order-placement-report.component.scss',
})
export class ProductSalesByOrderPlacementReportComponent implements OnInit {
  reportFilterConfig: ReportFilterConfigDto;

  constructor(
    private productSalesByOrderPlacementReportService: ProductSalesByOrderPlacementReportService,
  ) {}

  ngOnInit(): void {
    this.reportFilterConfig = {
      hasSingleDate: true,
      hasProductTypes: true,
      hasProductDepartments: true,
      hasStores: true,
      hasSalesType: true,
      hasReportCategory: true,
    } as ReportFilterConfigDto;
  }

  onReportGenerate(filters: ReportFilterDto) {
    const input = {
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      reportCategory: filters.reportCategory,
      salesTypes: filters.salesTypeIds,
      productTypes: filters.productTypeIds,
      productDepartments: filters.productDepartmentIds,
      stores: filters.storeIds,
    } as FilterPagedAndSortedOrderControlListResultRequestDto;

    this.productSalesByOrderPlacementReportService.generateReport(
      input,
      filters.storeNames,
      filters.productTypeNames,
      filters.productDepartmentNames,
      filters.salesTypeNames,
    );
  }
}
