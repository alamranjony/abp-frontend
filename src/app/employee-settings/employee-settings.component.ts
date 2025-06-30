import { LocalizationService } from '@abp/ng.core';
import { ToasterService } from '@abp/ng.theme.shared';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmployeeSettingService, PayrollFrequency } from '@proxy/employees';
import moment from 'moment';

const daysOfWeek: string[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

@Component({
  selector: 'app-employee-settings',
  templateUrl: './employee-settings.component.html',
  styleUrl: './employee-settings.component.scss',
})
export class EmployeeSettingsComponent implements OnInit {
  form: FormGroup;
  dayOfWeek: string = '';
  payrollFrequencies: { text: string; value: number }[];

  constructor(
    private readonly fb: FormBuilder,
    private readonly employeeSettingService: EmployeeSettingService,
    private readonly toaster: ToasterService,
    private readonly localizationService: LocalizationService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      autoCheckOut: [0, Validators.required],
      autoLogOff: [0, Validators.required],
      clockType: [0, Validators.required],
      dailyOvertimeThreshold: [0, Validators.required],
      weeklyOvertimeThreshold: [0, Validators.required],
      firstPayrollOfYear: [null, Validators.required],
      payrollFrequency: [0],
    });

    this.payrollFrequencies = Object.keys(PayrollFrequency)
      .filter(key => isNaN(Number(key)))
      .map(key => ({
        text: this.localizationService.instant(`::Enum:PayrollFrequency.${key}`),
        value: PayrollFrequency[key] as number,
      }));

    this.getEmployeeSettings();
  }

  private getEmployeeSettings() {
    this.employeeSettingService.getEmployeeSetting().subscribe(response => {
      this.form.patchValue(response);
      this.updateDayOfWeek(new Date(Date.parse(response.firstPayrollOfYear)));
    });
  }

  public saveEmployeeSettings() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }

    const formData = { ...this.form.value };
    formData.firstPayrollOfYear = moment(formData.firstPayrollOfYear).format('YYYY-MM-DD');

    const request = this.employeeSettingService.saveEmployeeSetting(formData);
    request.subscribe({
      next: () => {
        this.getEmployeeSettings();
        this.toaster.success('::EmployeeSettings:SavedSuccessfully');
      },
      error: () => {
        this.toaster.error('::EmployeeSettings:SaveError');
      },
    });
  }

  public updateDayOfWeek(date: Date) {
    if (date) {
      this.dayOfWeek = daysOfWeek[date.getDay()];
    } else {
      this.dayOfWeek = '';
    }
  }
}
