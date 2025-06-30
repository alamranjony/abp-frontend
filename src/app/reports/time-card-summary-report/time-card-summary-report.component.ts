import { ToasterService } from '@abp/ng.theme.shared';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmployeeLookupDto, EmployeeService } from '@proxy/employees';
import { InputFilterDto } from '@proxy/reports';
import { StoreLookupDto, StoreService } from '@proxy/stores';
import { ValueTypeSettingService } from '@proxy/value-type-settings';
import { EmployeeSettingsDto } from '@proxy/value-type-settings/employees';
import { ValueDto, ValueService } from '@proxy/values';
import { Subject, takeUntil } from 'rxjs';
import { TimeCardSummaryReportService } from 'src/app/services/reports/time-card-summary-report.service';

@Component({
  selector: 'app-time-card-summary-report',
  templateUrl: './time-card-summary-report.component.html',
  styleUrl: './time-card-summary-report.component.scss',
})
export class TimeCardSummaryReportComponent implements OnInit, OnDestroy {
  filterForm: FormGroup;
  storeList: StoreLookupDto[];
  fromDate: string;
  toDate: string;
  employeeList: EmployeeLookupDto[];
  departmentList: ValueDto[];
  employeeSettings: EmployeeSettingsDto;
  destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private toasterService: ToasterService,
    private storeService: StoreService,
    private timeCardReportService: TimeCardSummaryReportService,
    private employeeService: EmployeeService,
    private valueService: ValueService,
    private valueTypeSettingService: ValueTypeSettingService,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.getStores();
    this.getEmployees();
    this.getEmployeeSettings();
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
      .subscribe(employee => {
        this.employeeList = employee.items;
      });
  }

  getEmployeeSettings(): void {
    this.valueTypeSettingService
      .getEmployeeValueTypeSetting()
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        this.employeeSettings = res;
        this.getDepartments();
      });
  }

  getDepartments() {
    this.valueService
      .getAllValues()
      .pipe(takeUntil(this.destroy$))
      .subscribe(department => {
        this.departmentList = department.filter(
          c => c.valueTypeId === this.employeeSettings.department,
        );
      });
  }

  onReportGenerate() {
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
      stores: this.filterForm.value.stores,
      employees: this.filterForm.value.employees,
      departments: this.filterForm.value.departments,
    } as InputFilterDto;

    const selectedStores = this.storeList
      .filter(c => this.filterForm.value.stores.includes(c.id))
      ?.map(c => c.storeName);

    const selectedEmployees = this.employeeList
      .filter(e => this.filterForm.value.employees.includes(e.employeeId))
      ?.map(e => e.displayName);
    const selectedDepartments = this.departmentList
      .filter(d => this.filterForm.value.departments.includes(d.id))
      ?.map(d => d.name);

    this.timeCardReportService.generateReport(
      input,
      selectedStores,
      selectedEmployees,
      selectedDepartments,
    );
  }

  private buildForm(): void {
    const today = new Date();
    this.filterForm = this.fb.group({
      fromDate: [today, Validators.required],
      toDate: [today, Validators.required],
      stores: [[]],
      employees: [[]],
      departments: [[]],
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
