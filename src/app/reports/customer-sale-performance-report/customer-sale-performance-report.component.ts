import { Component, OnInit } from '@angular/core';
import { FilterPagedAndSortedOrderControlListResultRequestDto } from '@proxy/orders';
import { ReportFilterConfigDto } from 'src/app/models/report-filter-config-dto';
import { ReportFilterDto } from 'src/app/models/report-filter-dto';
import { CustomerSalePerformanceReportService } from 'src/app/services/customer-sale-performance-report.service';

@Component({
  selector: 'app-customer-sale-performance-report',
  templateUrl: './customer-sale-performance-report.component.html',
  styleUrl: './customer-sale-performance-report.component.scss',
})
export class CustomerSalePerformanceReportComponent implements OnInit {
  reportFilterConfig: ReportFilterConfigDto;
  constructor(private customerSalePerformanceReportService: CustomerSalePerformanceReportService) {}

  ngOnInit(): void {
    this.reportFilterConfig = {
      hasDateRange: true,
      hasCustomers: true,
      hasCustomerClass: true,
      hasNumberToRank: true,
    } as ReportFilterConfigDto;
  }

  onReportGenerate(filters: ReportFilterDto) {
    const input = {
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      customers: filters.customerIds,
      customerClassList: filters.selectedCustomerClassIds,
      numberToRank: filters.numberToRank,
    } as FilterPagedAndSortedOrderControlListResultRequestDto;

    this.customerSalePerformanceReportService.generateReport(
      input,
      filters.firstDateRange,
      filters.secondDateRange,
      filters.customerNames,
      filters.selectedCustomerClassNames,
    );
  }
}
