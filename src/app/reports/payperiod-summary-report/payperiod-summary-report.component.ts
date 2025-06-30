import { LocalizationService } from '@abp/ng.core';
import { ToasterService } from '@abp/ng.theme.shared';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmployeeSettingDto, EmployeeSettingService, PayrollFrequency } from '@proxy/employees';
import { InputFilterDto } from '@proxy/reports';
import { StoreLookupDto, StoreService } from '@proxy/stores';
import { ValueTypeSettingService } from '@proxy/value-type-settings';
import { EmployeeSettingsDto } from '@proxy/value-type-settings/employees';
import { ValueDto, ValueService } from '@proxy/values';
import { Subject, takeUntil } from 'rxjs';
import { PayPeriodSummaryReportService } from 'src/app/services/reports/payperiod-summary-report.service';

@Component({
  selector: 'app-payperiod-summary-report',
  templateUrl: './payperiod-summary-report.component.html',
  styleUrl: './payperiod-summary-report.component.scss',
})
export class PayperiodSummaryReportComponent implements OnInit, OnDestroy {
  filterForm: FormGroup;
  storeList: StoreLookupDto[];
  departmentList: ValueDto[];
  employeeValueTypeSetting: EmployeeSettingsDto;
  employeeSetting: EmployeeSettingDto;
  payPeriodSlots: { text: string; value: number; startDate: Date; endDate: Date }[] = [];
  payrollFrequencyName: string;
  newFirstPayrollOfYear: string;
  todayDate: string = new Date().toDateString();
  destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private storeService: StoreService,
    private valueService: ValueService,
    private valueTypeSettingService: ValueTypeSettingService,
    private employeeSettingService: EmployeeSettingService,
    private readonly localizationService: LocalizationService,
    private readonly payperiodReportService: PayPeriodSummaryReportService,
    private toaster: ToasterService,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.getStores();
    this.getEmployeeValueTypeSettings();
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

  getEmployeeSettings() {
    this.employeeSettingService.getEmployeeSetting().subscribe(response => {
      if (response) {
        this.employeeSetting = response;
        this.getPayperiodSlots(
          new Date(Date.parse(response.firstPayrollOfYear)),
          response.payrollFrequency,
        );
        this.payrollFrequencyName = this.localizationService.instant(
          `::Enum:PayrollFrequency.${PayrollFrequency[response.payrollFrequency]}`,
        );
        this.newFirstPayrollOfYear = new Date(
          this.payPeriodSlots[this.payPeriodSlots.length - 1].startDate,
        ).toDateString();
        this.filterForm.patchValue({
          fromDate: this.payPeriodSlots[this.payPeriodSlots.length - 1].startDate,
          payPeriodSlot: this.payPeriodSlots.length,
        });
      }
    });
  }

  getEmployeeValueTypeSettings(): void {
    this.valueTypeSettingService
      .getEmployeeValueTypeSetting()
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.employeeValueTypeSetting = response;
        this.getDepartments();
      });
  }
  getDepartments() {
    this.valueService
      .getAllValues()
      .pipe(takeUntil(this.destroy$))
      .subscribe(department => {
        this.departmentList = department.filter(
          c => c.valueTypeId === this.employeeValueTypeSetting.department,
        );
      });
  }

  onChangePayPeriodSlot(event: any) {
    if (event) {
      if (!event.value) {
        return;
      }
      let paySlot = this.payPeriodSlots.filter(c => c.value === event.value);
      if (paySlot.length > 0) {
        this.newFirstPayrollOfYear = paySlot[0].startDate.toDateString();
        this.todayDate = paySlot[0].endDate.toDateString();
        this.filterForm.patchValue({
          fromDate: paySlot[0].startDate,
          toDate: paySlot[0].endDate,
        });
      }
    }
  }

  onReportGenerate() {
    if (this.filterForm.invalid) {
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }

    const input = {
      fromDate: this.filterForm.value.fromDate.toDateString(),
      toDate: this.filterForm.value.toDate.toDateString(),
      stores: this.filterForm.value.stores,
      departments: this.filterForm.value.departments,
      dailyOverTime: this.employeeSetting.dailyOvertimeThreshold,
      weeklyOverTime: this.employeeSetting.weeklyOvertimeThreshold,
    } as InputFilterDto;

    const selectedStores = this.storeList
      .filter(c => this.filterForm.value.stores.includes(c.id))
      ?.map(c => c.storeName);
    const selectedDepartments = this.departmentList
      .filter(d => this.filterForm.value.departments.includes(d.id))
      ?.map(d => d.name);
    this.payperiodReportService.generateReport(
      input,
      selectedStores,
      selectedDepartments,
      this.employeeSetting.payrollFrequency,
    );
  }
  private getPayperiodSlots(date: Date, frequency: number) {
    let days = frequency === 0 ? 7 : 14;
    let months = frequency === 2 ? 1 : 2;
    let idx = 1;
    let currentDate = new Date();
    let newDate = new Date(date.toLocaleDateString());
    while (newDate <= currentDate) {
      let prevDate = new Date(newDate);
      if (frequency <= 1) {
        newDate.setDate(newDate.getDate() + days - 1);
        if (newDate >= currentDate)
          this.payPeriodSlots.push({
            text: currentDate.toDateString(),
            value: idx,
            startDate: prevDate,
            endDate: currentDate,
          });
        else
          this.payPeriodSlots.push({
            text: newDate.toDateString(),
            value: idx,
            startDate: prevDate,
            endDate: new Date(newDate),
          });
      } else if (frequency <= 3) {
        newDate.setMonth(newDate.getMonth() + months);
        if (newDate >= currentDate)
          this.payPeriodSlots.push({
            text: currentDate.toDateString(),
            value: idx,
            startDate: prevDate,
            endDate: currentDate,
          });
        else
          this.payPeriodSlots.push({
            text: newDate.toDateString(),
            value: idx,
            startDate: prevDate,
            endDate: new Date(newDate),
          });
      }
      idx++;
      newDate.setDate(newDate.getDate() + 1);
    }
  }

  private buildForm(): void {
    const today = new Date();
    this.filterForm = this.fb.group({
      fromDate: [today, Validators.required],
      toDate: [today, Validators.required],
      payPeriodSlot: [null],
      stores: [[]],
      departments: [[]],
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
