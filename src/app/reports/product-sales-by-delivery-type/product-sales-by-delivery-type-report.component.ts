import { Component, OnInit } from '@angular/core';
import { FilterPagedAndSortedOrderControlListResultRequestDto } from '@proxy/orders';
import { ReportFilterConfigDto } from 'src/app/models/report-filter-config-dto';
import { ReportFilterDto } from 'src/app/models/report-filter-dto';
import { ProductSalesByDeliveryTypeReportService } from 'src/app/services/product-sales-by-delivery-type-report.service';

@Component({
  selector: 'app-product-sales-by-delivery-type-report',
  templateUrl: './product-sales-by-delivery-type-report.component.html',
  styleUrl: './product-sales-by-delivery-type-report.component.scss',
})
export class ProductSalesByDeliveryTypeReportComponent implements OnInit {
  reportFilterConfig: ReportFilterConfigDto;

  constructor(
    private productSalesByDeliveryTypeReportService: ProductSalesByDeliveryTypeReportService,
  ) {}

  ngOnInit(): void {
    this.reportFilterConfig = {
      hasSingleDate: true,
      hasProductDepartments: true,
      hasStores: true,
      hasSalesType: true,
      hasReportCategory: true,
      hasProducts: true,
    } as ReportFilterConfigDto;
  }

  onReportGenerate(filters: ReportFilterDto) {
    if (!filters) return;

    const input = {
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      reportCategory: filters.reportCategory,
      salesTypes: filters.salesTypeIds,
      productIds: filters.productIds,
      productDepartments: filters.productDepartmentIds,
      stores: filters.storeIds,
    } as FilterPagedAndSortedOrderControlListResultRequestDto;

    this.productSalesByDeliveryTypeReportService.generateReport(
      input,
      filters.storeNames,
      filters.productNames,
      filters.productDepartmentNames,
      filters.salesTypeNames,
    );
  }
}
