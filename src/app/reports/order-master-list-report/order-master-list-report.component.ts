import { Component, OnInit } from '@angular/core';
import { FilterPagedAndSortedOrderControlListResultRequestDto } from '@proxy/orders';
import { ReportFilterConfigDto } from 'src/app/models/report-filter-config-dto';
import { ReportFilterDto } from 'src/app/models/report-filter-dto';
import { OrderMasterListReportService } from 'src/app/services/reports/order-master-list-report.service';

@Component({
  selector: 'app-order-master-list-report',
  templateUrl: './order-master-list-report.component.html',
  styleUrl: './order-master-list-report.component.scss',
})
export class OrderMasterListReportComponent implements OnInit {
  reportFilterConfig: ReportFilterConfigDto;
  constructor(private orderMasterListReportService: OrderMasterListReportService) {}

  ngOnInit(): void {
    this.reportFilterConfig = {
      hasDateCriteria: true,
      hasSingleDate: true,
      hasOrderStatus: true,
      hasOrderType: true,
      hasPaymentMethod: true,
      hasSearchOptions: true,
      hasPaymentStatus: true,
      hasOccasion: true,
      hasResidenceType: true,
      hasStores: true,
      hasDeliveryType: true,
      hasPriceRange: true,
      hasEmployeeClass: true,
    } as ReportFilterConfigDto;
  }

  onReportGenerate(filters: ReportFilterDto) {
    if (!filters) return;

    const input = {
      filterDateCategory: filters.filterDateCategory,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      stores: filters.storeIds,
      orderStatus: filters.orderStatus,
      orderTypes: filters.orderTypeIds,
      paymentMethod: filters.paymentMethod,
      paymentStatus: filters.paymentStatus,
      occasionCode: filters.occasionCode,
      deliveryCategory: filters.deliveryType,
      maxPriceRange: filters.maxPriceRange,
      minPriceRange: filters.minPriceRange,
      employeeClassList: filters.employeeClassIds,
      keyword: filters.keyword,
    } as FilterPagedAndSortedOrderControlListResultRequestDto;

    this.orderMasterListReportService.generateReport(input, filters);
  }
}
