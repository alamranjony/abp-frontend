import { ToasterService } from '@abp/ng.theme.shared';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmployeeLookupDto, EmployeeService } from '@proxy/employees';
import { InputFilterDto } from '@proxy/reports';
import { StoreLookupDto, StoreService } from '@proxy/stores';
import { Subject, takeUntil } from 'rxjs';
import { SalesVarianceBySalesRepReportService } from 'src/app/services/reports/sales-variance-by-sales-rep-report.service';

@Component({
  selector: 'app-sales-variance-by-sales-rep-report',
  templateUrl: './sales-variance-by-sales-rep-report.component.html',
  styleUrl: './sales-variance-by-sales-rep-report.component.scss',
})
export class SalesVarianceBySalesRepReportComponent implements OnInit, OnDestroy {
  filterForm: FormGroup;
  storeList: StoreLookupDto[];
  fromDate: string;
  toDate: string;
  employeeList: EmployeeLookupDto[];
  destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private toasterService: ToasterService,
    private storeService: StoreService,
    private employeeService: EmployeeService,
    private reportService: SalesVarianceBySalesRepReportService,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.getStores();
    this.getEmployees();
  }

  getStores() {
    this.storeService
      .getStoreLookup()
      .pipe(takeUntil(this.destroy$))
      .subscribe(store => {
        this.storeList = store.items;
      });
  }

  getEmployees() {
    this.employeeService
      .getEmployeeLookup()
      .pipe(takeUntil(this.destroy$))
      .subscribe(employees => {
        this.employeeList = employees.items;
      });
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
    const thirdColumnDateRange = this.filterForm.value.thirdColumnDateRangeGroup;
    const fourthColumnDateRange = this.filterForm.value.fourthColumnDateRangeGroup;

    const input = {
      stores: this.filterForm.value.stores,
      employees: this.filterForm.value.employees,
      totalSubOrderAmount: this.filterForm.value.mdseOrTotal,
    } as InputFilterDto;

    const selectedStores = this.storeList
      .filter(c => this.filterForm.value.stores.includes(c.id))
      ?.map(c => c.storeName);

    const selectedAmount = this.filterForm.value.mdseOrTotal as number;

    this.reportService.generateReport(
      input,
      selectedStores,
      firstColumnDateRange,
      secondColumnDateRange,
      thirdColumnDateRange,
      fourthColumnDateRange,
      selectedAmount,
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
      thirdColumnDateRangeGroup: this.fb.group({
        fromDate: [today, Validators.required],
        toDate: [nextWeekDate, Validators.required],
      }),
      fourthColumnDateRangeGroup: this.fb.group({
        fromDate: [today, Validators.required],
        toDate: [nextWeekDate, Validators.required],
      }),
      mdseOrTotal: [null],
      stores: [[]],
      employees: [[]],
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

    const thirdFromDate = this.filterForm.value.thirdColumnDateRangeGroup?.fromDate
      ? new Date(this.filterForm.value.thirdColumnDateRangeGroup.fromDate)
      : null;
    const thirdToDate = this.filterForm.value.thirdColumnDateRangeGroup?.toDate
      ? new Date(this.filterForm.value.thirdColumnDateRangeGroup.toDate)
      : null;

    const fourthFromDate = this.filterForm.value.fourthColumnDateRangeGroup?.fromDate
      ? new Date(this.filterForm.value.fourthColumnDateRangeGroup.fromDate)
      : null;
    const fourthToDate = this.filterForm.value.fourthColumnDateRangeGroup?.toDate
      ? new Date(this.filterForm.value.fourthColumnDateRangeGroup.toDate)
      : null;

    if (firstFromDate && firstToDate && firstFromDate > firstToDate) return false;
    if (secondFromDate && secondToDate && secondFromDate > secondToDate) return false;
    if (thirdFromDate && thirdToDate && thirdFromDate > thirdToDate) return false;
    if (fourthFromDate && fourthToDate && fourthFromDate > fourthToDate) return false;

    return true;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
