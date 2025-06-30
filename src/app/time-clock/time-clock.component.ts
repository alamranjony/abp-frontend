import { ToasterService } from '@abp/ng.theme.shared';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { CheckInOutDto, CheckInOutService, CreateUpdateCheckInOutDto } from '@proxy/check-in-outs';
import { EmployeeSettingDto } from '@proxy/employees';
import { StoreLookupDto } from '@proxy/stores';
import { EmployeeSettingsDto } from '@proxy/value-type-settings/employees';
import { ValueDto } from '@proxy/values';

@Component({
  selector: 'app-time-clock',
  templateUrl: './time-clock.component.html',
  styleUrl: './time-clock.component.scss',
})
export class TimeClockComponent implements OnInit {
  form: FormGroup;
  checkinForm: FormGroup;
  authenticated: boolean = false;
  stores: StoreLookupDto[];
  departmentValues: ValueDto[];
  employeeValueTypeSettings: EmployeeSettingsDto;
  employeeSettings: EmployeeSettingDto;
  currentCheckInOut: CheckInOutDto;
  currentTime: Date = new Date();
  currentStaticTime: Date;
  displayName: string;
  createChechInOut: CreateUpdateCheckInOutDto;
  isCheckOut: boolean = false;
  isClocked: boolean = false;
  employeeId: string;
  pin: string;
  clockedLocation: string;
  intervalTime: number = 1000;

  constructor(
    public dialogRef: MatDialogRef<TimeClockComponent>,
    private fb: FormBuilder,
    private toasterService: ToasterService,
    private checkInOutService: CheckInOutService,
  ) {}
  ngOnInit(): void {
    this.buildForm();
    this.getStores();
    this.getEmployeeValueTypeSettings();
    this.getEmployeeSetting();

    setInterval(() => {
      this.currentTime = new Date();
    }, this.intervalTime);
  }

  buildForm() {
    this.form = this.fb.group({
      employeeId: ['', Validators.required],
      pin: ['', Validators.required],
    });
  }

  buildCheckInForm() {
    this.checkinForm = this.fb.group({
      shopId: [this.currentCheckInOut.shopId, Validators.required],
      departmentId: [this.currentCheckInOut.departmentId, Validators.required],
      comment: [this.currentCheckInOut.comment],
    });
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toasterService.error('::ValidationError:InvalidFormOrData');
      return;
    }

    let employee = this.form.value;
    this.employeeId = employee.employeeId;
    this.pin = employee.pin;
    const request = this.checkInOutService.getVerifiedCheckInOut(employee.employeeId, employee.pin);
    request.subscribe(response => {
      if (response.employeeId === '') {
        this.toasterService.error('::TimeClock:ErrorOnVarify');
        this.form.markAllAsTouched();
      } else {
        this.currentCheckInOut = response;
        this.displayName = response.displayName;
        this.isCheckOut = response.isCheckIn;
        this.getDepartments();
        this.buildCheckInForm();
        this.authenticated = true;
        if (response.isCheckIn) {
          this.checkinForm.get('shopId')?.disable();
          this.checkinForm.get('departmentId')?.disable();
        }
      }
    });
  }

  checkIn() {
    if (this.checkinForm.invalid) {
      this.checkinForm.markAllAsTouched();
      this.toasterService.error('::ValidationError:InvalidFormOrData');
      return;
    }

    const createUpdateChechInOut = {
      currentTime: new Date().toUTCString(),
      employeeId: this.currentCheckInOut.employeeId,
      isCheckIn: true,
      isCheckOut: false,
      shopId: this.checkinForm.value.shopId,
      departmentId: this.checkinForm.value.departmentId,
      comment: this.checkinForm.value.comment,
      isClosed: this.currentCheckInOut.isClosed,
    };

    const request = this.checkInOutService.createUpdateCheckInOut(
      createUpdateChechInOut,
      this.employeeId,
      this.pin,
    );
    request.subscribe({
      next: () => {
        this.currentStaticTime = this.currentTime;
        let store = this.stores.filter(c => c.id == this.checkinForm.value.shopId);
        this.clockedLocation = store[0]?.storeName ?? '';
        this.isClocked = true;
        this.authenticated = false;
      },
      error: err => {
        this.toasterService.error('::TimeClock:ErrorOnClocked');
      },
    });
  }

  checkOut() {
    if (this.checkinForm.invalid) {
      this.checkinForm.markAllAsTouched();
      this.toasterService.error('::ValidationError:InvalidFormOrData');
      return;
    }
    
    const createUpdateChechInOut = {
      currentTime: new Date().toUTCString(),
      employeeId: this.currentCheckInOut.employeeId,
      isCheckIn: true,
      isCheckOut: true,
      shopId: this.currentCheckInOut.shopId,
      departmentId: this.currentCheckInOut.departmentId,
      comment: this.checkinForm.value.comment,
      isClosed: true,
    };
    const request = this.checkInOutService.createUpdateCheckInOut(
      createUpdateChechInOut,
      this.employeeId,
      this.pin,
    );
    request.subscribe({
      next: () => {
        this.currentStaticTime = this.currentTime;
        let store = this.stores.filter(c => c.id == this.currentCheckInOut.shopId);
        this.clockedLocation = store[0]?.storeName ?? '';
        this.isClocked = true;
        this.authenticated = false;
      },
      error: err => {
        this.toasterService.error('::TimeClock:ErrorOnClocked');
      },
    });
  }

  getStores() {
    this.checkInOutService.getStoreLookup().subscribe(res => (this.stores = res.items));
  }

  getEmployeeValueTypeSettings(): void {
    this.checkInOutService.getEmployeeValueTypeSetting().subscribe(res => {
      this.employeeValueTypeSettings = res;
    });
  }

  getDepartments() {
    this.checkInOutService
      .getAllDepartment(this.employeeValueTypeSettings.department)
      .subscribe(res => {
        this.departmentValues = res;
      });
  }

  getEmployeeSetting(): void {
    this.checkInOutService.getEmployeeSetting().subscribe(res => {
      this.employeeSettings = res;
    });
  }
}
