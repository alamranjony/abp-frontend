import { Component, OnDestroy, OnInit } from '@angular/core';
import { SchedulerSettingService } from '@proxy/scheduler-settings';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { ToasterService } from '@abp/ng.theme.shared';
import { Subject, takeUntil } from 'rxjs';
import { CustomerHouseAccountSchedulerService } from '@proxy/customers';

@Component({
  selector: 'app-scheduler-settings',
  templateUrl: './scheduler-settings.component.html',
  styleUrl: './scheduler-settings.component.scss',
})
export class SchedulerSettingsComponent implements OnInit, OnDestroy {
  firstDayOfMonthInUtc: string;
  destroy$: Subject<void> = new Subject();

  form: FormGroup;
  selectedDate: Date;
  constructor(
    private schedulerSettingService: SchedulerSettingService,
    private fb: FormBuilder,
    private toaster: ToasterService,
    private customerHouseAccountSchedulerService: CustomerHouseAccountSchedulerService,
  ) {
    this.buildForm();
  }

  ngOnInit(): void {
    this.getSchedulerSettings();
  }

  buildForm() {
    this.form = this.fb.group({
      settings: this.fb.array([]),
    });
  }

  getSchedulerSettings() {
    this.schedulerSettingService.getSchedulerSettingsList().subscribe(settings => {
      this.setSettings(settings);
    });
  }

  setSettings(settings) {
    const settingsArray = this.form.get('settings') as FormArray;
    settings.forEach(setting => {
      settingsArray.push(
        this.fb.group({
          name: [setting.name],
          isEnabled: [setting.isEnabled],
        }),
      );
    });
  }

  get settings(): FormArray {
    return this.form.get('settings') as FormArray;
  }

  resetForm(): void {
    this.settings.clear();
    this.getSchedulerSettings();
  }

  onSubmit(): void {
    const request = this.schedulerSettingService.saveSchedulerSettings(this.form.value.settings);
    request.subscribe({
      next: () => {
        this.resetForm();
        this.toaster.success('::SchedulerSettingSavedSuccessfully');
      },
      error: err => {
        this.toaster.error('::SchedulerSettingSaveError');
      },
    });
  }

  onDateChange() {
    const firstDayOfMonth = new Date(
      this.selectedDate.getFullYear(),
      this.selectedDate.getMonth(),
      1,
    );
    this.firstDayOfMonthInUtc = firstDayOfMonth.toISOString();
  }

  testScheduler() {
    this.customerHouseAccountSchedulerService
      .testScheduler(this.firstDayOfMonthInUtc)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
