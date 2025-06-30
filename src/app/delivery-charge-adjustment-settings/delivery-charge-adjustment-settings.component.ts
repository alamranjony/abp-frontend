import { ToasterService } from '@abp/ng.theme.shared';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  DeliveryChargeAdjustmentSettingDto,
  DeliveryChargeAdjustmentSettingService,
} from '@proxy/deliveries';
import moment from 'moment';

@Component({
  selector: 'app-delivery-charge-adjustment-settings',
  templateUrl: './delivery-charge-adjustment-settings.component.html',
  styleUrl: './delivery-charge-adjustment-settings.component.scss',
})
export class DeliveryChargeAdjustmentSettingsComponent implements OnInit {
  form: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private deliveryChargeAdjustmentSettingService: DeliveryChargeAdjustmentSettingService,
    private toaster: ToasterService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      isEnabled: [false],
      priceAdjustment: [{ value: 0.0, disabled: true }, Validators.required],
      isIncreaseNow: [{ value: true, disabled: true }],
      startDate: [{ value: null, disabled: true }],
      endDate: [{ value: null, disabled: true }],
    });

    this.setupValueChangeHandlers();
    this.getDeliveryChargeAdjustSettings();
  }

  private setupValueChangeHandlers() {
    this.form.get('isEnabled').valueChanges.subscribe(isEnabled => {
      if (isEnabled) {
        this.form.get('priceAdjustment').enable();
        this.form.get('isIncreaseNow').enable();
      } else {
        this.form.get('priceAdjustment').disable();
        this.form.get('isIncreaseNow').disable();
        this.form.get('startDate').disable();
        this.form.get('endDate').disable();
      }
    });

    this.form.get('isIncreaseNow').valueChanges.subscribe(isIncreaseNow => {
      if (this.form.get('isEnabled').value && isIncreaseNow === false) {
        this.form.get('startDate').enable();
        this.form.get('endDate').enable();
      } else {
        this.form.get('startDate').disable();
        this.form.get('endDate').disable();
      }
    });
  }

  private getDeliveryChargeAdjustSettings() {
    this.deliveryChargeAdjustmentSettingService
      .getDeliveryChargeAdjustmentSetting()
      .subscribe(response => {
        this.form.patchValue(response);
        if (response.isEnabled) {
          this.form.get('isEnabled').setValue(response.isEnabled, { emitEvent: true });
        }
        if (response.isIncreaseNow === false) {
          this.form.get('isIncreaseNow').setValue(response.isIncreaseNow, { emitEvent: true });
        }
      });
  }

  saveDeliveryChargeAdjustmentSettings() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }
    const formData = { ...this.form.value };
    formData.startDate = moment(formData.startDate).format('YYYY-MM-DD');
    formData.endDate = moment(formData.endDate).format('YYYY-MM-DD');

    if (!formData.isEnabled) {
      this.deliveryChargeAdjustmentSettingService
        .getDeliveryChargeAdjustmentSetting()
        .subscribe(existingData => {
          const updatedData = {
            ...existingData,
            isEnabled: formData.isEnabled,
          };
          this.save(updatedData);
        });
    } else {
      this.save(formData);
    }
  }

  private save(data: DeliveryChargeAdjustmentSettingDto) {
    const request =
      this.deliveryChargeAdjustmentSettingService.saveDeliveryChargeAdjustmentSetting(data);
    request.subscribe({
      next: () => {
        this.getDeliveryChargeAdjustSettings();
        this.toaster.success('Saved successfully');
      },
      error: () => {
        this.toaster.error('An error occurred');
      },
    });
  }
}
