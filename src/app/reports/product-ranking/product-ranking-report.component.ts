import { ToasterService } from '@abp/ng.theme.shared';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { FilterPagedAndSortedOrderControlListResultRequestDto } from '@proxy/orders';
import { Subject } from 'rxjs';
import { ProductRankingReportService } from 'src/app/services/product-ranking-report.service';

@Component({
  selector: 'app-product-ranking-report',
  templateUrl: './product-ranking-report.component.html',
  styleUrl: './product-ranking-report.component.scss',
})
export class ProductRankingReportComponent implements OnInit, OnDestroy {
  filterForm: FormGroup;
  fromDate: string;
  toDate: string;
  destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private toasterService: ToasterService,
    private productRankingReportService: ProductRankingReportService,
  ) {}

  ngOnInit(): void {
    this.buildForm();
  }

  onReportGenerate() {
    if (this.filterForm.invalid) {
      this.toasterService.error('::OrderReport:FormValidation');
      return;
    }

    const fromDateValue = this.filterForm.value.fromDate
      ? new Date(this.filterForm.value.fromDate)
      : null;

    const toDateValue = this.filterForm.value.toDate
      ? new Date(this.filterForm.value.toDate)
      : null;

    if (fromDateValue && toDateValue && fromDateValue > toDateValue) {
      this.toasterService.error('::OrderControl:DateValidation');
      return;
    }

    this.fromDate = fromDateValue ? fromDateValue.toDateString() : null;
    this.toDate = toDateValue ? toDateValue.toDateString() : null;

    const input = {
      fromDate: this.fromDate,
      toDate: this.toDate,
    } as FilterPagedAndSortedOrderControlListResultRequestDto;

    this.productRankingReportService.generateReport(input);
  }

  private buildForm(): void {
    const today = new Date();
    const lastWeekDate = new Date();
    lastWeekDate.setDate(today.getDate() - 7);

    this.filterForm = this.fb.group({
      fromDate: [lastWeekDate, Validators.required],
      toDate: [today, Validators.required],
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
