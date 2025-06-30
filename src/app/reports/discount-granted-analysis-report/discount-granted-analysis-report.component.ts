import { ToasterService } from '@abp/ng.theme.shared';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputFilterDto } from '@proxy/reports';
import { StoreLookupDto, StoreService } from '@proxy/stores';
import { Subject, takeUntil } from 'rxjs';
import { DisCountGrantedAnalysisReportService } from 'src/app/services/reports/discount-granted-analysis-report.service';

@Component({
  selector: 'app-discount-granted-analysis-report',
  templateUrl: './discount-granted-analysis-report.component.html',
  styleUrl: './discount-granted-analysis-report.component.scss',
})
export class DiscountGrantedAnalysisReportComponent implements OnInit, OnDestroy {
  filterForm: FormGroup;
  storeList: StoreLookupDto[];
  fromDate: string;
  toDate: string;
  destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private toasterService: ToasterService,
    private storeService: StoreService,
    private reportService: DisCountGrantedAnalysisReportService,
  ) {}
  ngOnInit(): void {
    this.buildForm();
    this.getStores();
  }
  getStores() {
    this.storeService
      .getStoreLookup()
      .pipe(takeUntil(this.destroy$))
      .subscribe(store => {
        this.storeList = store.items;
      });
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onReportGenerate() {
    if (this.filterForm.invalid) {
      this.toasterService.error('::OrderReport:FormValidation');
      return;
    }

    if (!this.isValidDateRange()) {
      this.toasterService.error('::OrderControl:DateValidation');
      return;
    }
    const firstColumnDateRange = this.filterForm.value.firstColumnDateRangeGroup;
    const secondColumnDateRange = this.filterForm.value.secondColumnDateRangeGroup;

    const { minDate, maxDate } = this.getMinMaxDate();

    const input = {
      stores: this.filterForm.value.stores,
      fromDate: minDate ? minDate.toLocalISOString() : null,
      toDate: maxDate ? maxDate.toLocalISOString() : null,
    } as InputFilterDto;

    const selectedStores = this.storeList
      .filter(c => this.filterForm.value.stores.includes(c.id))
      ?.map(c => c.storeName);

    this.reportService.generateReport(
      input,
      selectedStores,
      firstColumnDateRange,
      secondColumnDateRange,
    );
  }

  private buildForm(): void {
    const today = new Date();
    const lastWeekDate = new Date();
    lastWeekDate.setDate(today.getDate() - 7);
    const nextWeekDate = new Date();
    nextWeekDate.setDate(today.getDate() + 7);

    this.filterForm = this.fb.group({
      firstColumnDateRangeGroup: this.fb.group({
        fromDate: [lastWeekDate, Validators.required],
        toDate: [today, Validators.required],
      }),
      secondColumnDateRangeGroup: this.fb.group({
        fromDate: [today, Validators.required],
        toDate: [nextWeekDate, Validators.required],
      }),
      stores: [[]],
    });
  }

  private isValidDateRange(): boolean {
    const firstFromDate = this.filterForm.value.firstColumnDateRangeGroup?.fromDate
      ? new Date(this.filterForm.value.firstColumnDateRangeGroup.fromDate)
      : null;
    const firstToDate = this.filterForm.value.firstColumnDateRangeGroup?.toDate
      ? new Date(this.filterForm.value.firstColumnDateRangeGroup.toDate)
      : null;

    const secondFromDate = this.filterForm.value.secondColumnDateRangeGroup?.fromDate
      ? new Date(this.filterForm.value.secondColumnDateRangeGroup.fromDate)
      : null;
    const secondToDate = this.filterForm.value.secondColumnDateRangeGroup?.toDate
      ? new Date(this.filterForm.value.secondColumnDateRangeGroup.toDate)
      : null;

    if (firstFromDate && firstToDate && firstFromDate > firstToDate) return false;
    if (secondFromDate && secondToDate && secondFromDate > secondToDate) return false;

    return true;
  }

  private getMinMaxDate(): { minDate: Date | null; maxDate: Date | null } {
    const firstFromDate = this.filterForm.value.firstColumnDateRangeGroup?.fromDate
      ? new Date(this.filterForm.value.firstColumnDateRangeGroup.fromDate)
      : null;
    const firstToDate = this.filterForm.value.firstColumnDateRangeGroup?.toDate
      ? new Date(this.filterForm.value.firstColumnDateRangeGroup.toDate)
      : null;

    const secondFromDate = this.filterForm.value.secondColumnDateRangeGroup?.fromDate
      ? new Date(this.filterForm.value.secondColumnDateRangeGroup.fromDate)
      : null;
    const secondToDate = this.filterForm.value.secondColumnDateRangeGroup?.toDate
      ? new Date(this.filterForm.value.secondColumnDateRangeGroup.toDate)
      : null;

    const allDates = [firstFromDate, firstToDate, secondFromDate, secondToDate].filter(
      date => date !== null,
    ) as Date[];

    return {
      minDate: allDates.length ? new Date(Math.min(...allDates.map(date => date.getTime()))) : null,
      maxDate: allDates.length ? new Date(Math.max(...allDates.map(date => date.getTime()))) : null,
    };
  }
}
