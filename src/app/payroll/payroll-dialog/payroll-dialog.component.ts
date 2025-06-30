import { LocalizationService, PagedResultDto } from '@abp/ng.core';
import { ToasterService } from '@abp/ng.theme.shared';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EmployeeDto, EmployeeService } from '@proxy/employees';
import { FilterPagedAndSortedResultRequestDto } from '@proxy/shared';
import { StoreLookupDto, StoreService } from '@proxy/stores';
import { ValueTypeSettingService } from '@proxy/value-type-settings';
import { EmployeeSettingsDto } from '@proxy/value-type-settings/employees';
import { ValueDto, ValueService } from '@proxy/values';

@Component({
  selector: 'app-payroll-dialog',
  templateUrl: './payroll-dialog.component.html',
  styleUrl: './payroll-dialog.component.scss',
})
export class PayrollDialogComponent implements OnInit {
  form: FormGroup;
  stores: StoreLookupDto[];
  departmentValues: ValueDto[];
  employeeSettings: EmployeeSettingsDto;
  employees = { items: [], totalCount: 0 } as PagedResultDto<EmployeeDto>;
  existingCheckinTime: string;
  existingCheckoutTime: string;

  constructor(
    private readonly fb: FormBuilder,
    public dialogRef: MatDialogRef<PayrollDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private storeService: StoreService,
    private valueTypeSettingService: ValueTypeSettingService,
    private valueService: ValueService,
    private employeeService: EmployeeService,
    private toaster: ToasterService,
  ) {}

  ngOnInit(): void {
    this.existingCheckinTime = this.getTimeFromDate(this.data?.currentTime);
    if (this.data?.checkoutTime)
      this.existingCheckoutTime = this.getTimeFromDate(this.data?.checkoutTime);

    this.buildForm();
    this.getStores();
    this.getEmployees();
    this.getEmployeeSettings();
  }

  private buildForm() {
    this.form = this.fb.group({
      employeeId: [this.data.employeeId || null, Validators.required],
      departmentId: [this.data.departmentId || null, Validators.required],
      shopId: [this.data.shopId || null, Validators.required],
      checkInDate: [this.data.currentTime || new Date(), Validators.required],
      checkInTime: [this.existingCheckinTime || '', Validators.required],
      checkOutTime: [this.existingCheckoutTime || ''],
      checkOutDate: [this.data.checkoutTime || ''],
      comment: [this.data.comment || ''],
    });
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }

    this.dialogRef.close(this.form.value);
  }

  onClose(): void {
    this.dialogRef.close();
  }

  getStores() {
    this.storeService.getStoreLookup().subscribe(res => (this.stores = res.items));
  }

  getEmployeeSettings(): void {
    this.valueTypeSettingService.getEmployeeValueTypeSetting().subscribe(res => {
      this.employeeSettings = res;
      this.getDepartments();
    });
  }

  getDepartments() {
    this.valueService.getAllValues().subscribe(res => {
      this.departmentValues = res.filter(c => c.valueTypeId === this.employeeSettings.department);
    });
  }

  getEmployees() {
    this.employeeService
      .getList({ filter: '', maxResultCount: 20 } as FilterPagedAndSortedResultRequestDto)
      .subscribe(res => {
        this.employees = res;
      });
  }

  getCombinedDateTime(date: any, time: any): Date | null {
    if (date && time) {
      const [hours, minutes] = time.split(':').map((value: string) => parseInt(value, 10));

      const checkOutDateTime = new Date(date);
      checkOutDateTime.setHours(hours);
      checkOutDateTime.setMinutes(minutes);
      return checkOutDateTime;
    }
    return null;
  }

  getTimeFromDate(date: Date): string {
    if (!date) date = new Date();
    let hours = new Date(date).getHours();
    let minutes = new Date(date).getMinutes();
    if (date) {
      return (
        (hours < 10 ? '0' + hours.toString() : hours.toString()) +
        ':' +
        (minutes < 10 ? '0' + minutes.toString() : minutes.toString())
      );
    } else return '';
  }
}
