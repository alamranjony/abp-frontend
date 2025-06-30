import { ToasterService } from '@abp/ng.theme.shared';
import { Component, Inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { VehicleSettingsDto } from '@proxy/value-type-settings/vehicles';
import { ValueDto, ValueTypeLookupDto } from '@proxy/values';
import { CheckVehicleNoDto, VehicleService } from '@proxy/vehicles';
import { map, Observable, of, switchMap, timer } from 'rxjs';
import { DEBOUNCE_TIME, VIN_NO_MAX_LIMIT } from 'src/app/shared/constants';
import { SharedModule } from 'src/app/shared/shared.module';

@Component({
  selector: 'app-vehicle-dialog',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './vehicle-dialog.component.html',
  styleUrl: './vehicle-dialog.component.scss',
})
export class VehicleDialogComponent implements OnInit {
  form: FormGroup;
  pValueList$: Observable<ValueTypeLookupDto[]>;
  statusValues: ValueDto[];
  values: ValueDto[];
  vehicleSettings: VehicleSettingsDto;
  vehicleId: string;

  constructor(
    private readonly fb: FormBuilder,
    public dialogRef: MatDialogRef<VehicleDialogComponent>,
    private vehicleService: VehicleService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toaster: ToasterService,
  ) {
    this.vehicleId = data?.id;
  }

  ngOnInit(): void {
    this.buildForm();
    this.getValues();
  }

  private buildForm() {
    this.form = this.fb.group({
      vehicleNo: [
        this.data.vehicleNo || '',
        {
          validators: [Validators.required],
          asyncValidators: [this.vehicleNoUniqueValidator()],
          updateOn: 'change',
        },
      ],
      licensePlate: [this.data.licensePlate || '', Validators.required],
      name: [this.data.name, Validators.required],
      vin: [
        this.data.vin || '',
        [
          Validators.required,
          Validators.minLength(VIN_NO_MAX_LIMIT),
          Validators.maxLength(VIN_NO_MAX_LIMIT),
        ],
      ],
      mileage: [this.data.mileage || 0, Validators.required],
      model: [this.data.model || '', Validators.required],
      statusValueId: [this.data.statusValueId || '', Validators.required],
      expirationDate: [this.data.expirationDate ? new Date(this.data.expirationDate) : null],
      maintenanceDue: [this.data.maintenanceDue ? new Date(this.data.maintenanceDue) : null],
    });
  }

  vehicleNoUniqueValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value) return of(null);

      let checkVehicleNoDto: CheckVehicleNoDto = {
        vehicleNo: control.value,
        vehicleId: this.vehicleId,
      };
      return timer(DEBOUNCE_TIME).pipe(
        switchMap(() =>
          this.vehicleService.isVehicleNoUnique(checkVehicleNoDto).pipe(
            map(isUnique => {
              return isUnique ? null : { vehicleNoExists: true };
            }),
          ),
        ),
      );
    };
  }

  getValues() {
    this.vehicleService.getVehicleValueTypeList().subscribe(res => {
      const { statusList, preselectedStatusId } = res;
      this.statusValues = statusList;
      this.setFormValue('statusValueId', preselectedStatusId);
    });
  }

  private setFormValue(controlName: string, value: any) {
    if (value) {
      this.form.get(controlName)?.setValue(value);
    }
  }

  getStatusValues() {
    this.statusValues = this.values.filter(v => v.valueTypeId === this.vehicleSettings.status);
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
}
