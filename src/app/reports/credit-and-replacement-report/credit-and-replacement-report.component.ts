import { Component, OnInit } from '@angular/core';
import {
  FilterPagedAndSortedOrderControlListResultRequestDto,
  OrderType,
  orderTypeOptions,
} from '@proxy/orders';
import { ReportFilterConfigDto } from 'src/app/models/report-filter-config-dto';
import { ReportFilterDto } from 'src/app/models/report-filter-dto';
import { PdfGeneratorService } from 'src/app/services/pdf-generator.service';

@Component({
  selector: 'app-credit-and-replacement-report',
  templateUrl: './credit-and-replacement-report.component.html',
  styleUrl: './credit-and-replacement-report.component.scss',
})
export class CreditAndReplacementReportComponent implements OnInit {
  reportFilterConfig: ReportFilterConfigDto;
  orderTypes = orderTypeOptions.filter(c => [OrderType.IVCR, OrderType.RP].includes(c.value));

  constructor(private readonly pdfGeneratorService: PdfGeneratorService) {}

  ngOnInit(): void {
    this.reportFilterConfig = {
      hasDateCriteria: true,
      hasSingleDate: true,
      hasOrderType: true,
      hasStores: true,
      hasProductDepartments: true,
      hasProducts: true,
      hasCancellationReason: true,
      hasReplacementReason: true,
    } as ReportFilterConfigDto;
  }

  onReportGenerate(filters: ReportFilterDto) {
    if (!filters) return;

    const input = {
      filterDateCategory: filters.filterDateCategory,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      stores: filters.storeIds,
      orderTypes: filters.orderTypeIds,
      productDepartments: filters.productDepartmentIds,
      productIds: filters.productIds,
      cancellationReasonIds: filters.cancellationReasonIds,
      replacementReasonIds: filters.replacementReasonIds,
    } as FilterPagedAndSortedOrderControlListResultRequestDto;

    this.pdfGeneratorService.generateCreditAndReplacementOrderReport(input, filters);
  }
}
