import { ToasterService } from '@abp/ng.theme.shared';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { WireService, wireServiceOptions } from '@proxy/common';
import { WireServiceAllocationSettingService } from '@proxy/store-specific-settings';
import {
  CreateUpdateWireServiceAllocationSettingDto,
  WireServiceAllocationSettingDto,
} from '@proxy/store-specific-settings/wire-service-allocation-settings';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-store-wire-service-allocation',
  templateUrl: './store-wire-service-allocation.component.html',
  styleUrl: './store-wire-service-allocation.component.scss',
})
export class StoreWireServiceAllocationComponent implements OnInit, OnDestroy {
  form: FormGroup;
  wireServiceTypeOptions = wireServiceOptions;
  currentWireService: WireService = WireService.Bloomnet;
  wireService = WireService;
  wireServiceAllocationSetting: WireServiceAllocationSettingDto;
  destroy$: Subject<void> = new Subject();

  constructor(
    private fb: FormBuilder,
    private toaster: ToasterService,
    private wireServiceAllocationSettingService: WireServiceAllocationSettingService,
  ) {}

  ngOnInit(): void {
    this.getWireServiceAllocationSetting();
    this.buildForm();
  }

  private buildForm() {
    this.form = this.fb.group({
      incomingDeliveryCharge: [null, [Validators.required]],
      wireOutCommission: [null],
      exchangeRate: [null],
      wireInCommission: [null],
      clearingFees: [null],
      wireServiceType: [this.currentWireService],
      quota: [null],
      applyForAllStore: [false],
      bloomnetQuota: [{ value: null, disabled: this.currentWireService !== WireService.Bloomnet }],
      telefloraQuota: [
        { value: null, disabled: this.currentWireService !== WireService.Teleflora },
      ],
      ftdQuota: [{ value: null, disabled: this.currentWireService !== WireService.FTD }],
      masDirectQuota: [
        { value: null, disabled: this.currentWireService !== WireService.MasDirect },
      ],
      fsnQuota: [{ value: null, disabled: this.currentWireService !== WireService.FSN }],
    });
  }

  onQuotaChange(event: Event) {
    const quotaValue = (event.target as HTMLInputElement).value;
    switch (this.currentWireService) {
      case WireService.Bloomnet:
        this.form.get('bloomnetQuota').setValue(quotaValue);
        break;
      case WireService.Teleflora:
        this.form.get('telefloraQuota').setValue(quotaValue);
        break;
      case WireService.FTD:
        this.form.get('ftdQuota').setValue(quotaValue);
        break;
      case WireService.MasDirect:
        this.form.get('masDirectQuota').setValue(quotaValue);
        break;
      case WireService.FSN:
        this.form.get('fsnQuota').setValue(quotaValue);
        break;
    }
  }

  private updateQuotaControls() {
    const quotaValue = this.form.get('quota').value;
    this.form
      .get('bloomnetQuota')
      .setValue(this.currentWireService === WireService.Bloomnet ? quotaValue : null);
    this.form
      .get('telefloraQuota')
      .setValue(this.currentWireService === WireService.Teleflora ? quotaValue : null);
    this.form
      .get('ftdQuota')
      .setValue(this.currentWireService === WireService.FTD ? quotaValue : null);
    this.form
      .get('masDirectQuota')
      .setValue(this.currentWireService === WireService.MasDirect ? quotaValue : null);
    this.form
      .get('fsnQuota')
      .setValue(this.currentWireService === WireService.FSN ? quotaValue : null);

    Object.keys(this.form.controls).forEach(controlName => {
      if (controlName.endsWith('Quota')) {
        const serviceType = controlName.replace('Quota', '');
        if (serviceType === WireService[this.currentWireService]) {
          this.form.get(controlName).enable();
        } else {
          this.form.get(controlName).disable();
        }
      }
    });
  }

  onWireServiceChange(event: MatSelectChange) {
    this.currentWireService = event.value as WireService;
    this.clearFields();
    this.getWireServiceAllocationSetting();
  }

  private clearFields() {
    Object.keys(this.form.controls).forEach(controlName => {
      if (controlName !== 'wireService') {
        this.form.get(controlName).reset();
      }
    });
  }

  private getWireServiceAllocationSetting() {
    this.wireServiceAllocationSettingService
      .getWireServiceAllocationSetting(this.currentWireService)
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.wireServiceAllocationSetting = response;
        this.form.patchValue(response);
        this.updateQuotaControls();
      });
  }

  preventDecimal(event: KeyboardEvent): void {
    if (event.key === '.' || event.key === ',') {
      event.preventDefault();
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }

    const applyForAllStore = this.form.get('applyForAllStore').value as boolean;
    const formValue = this.form.value as CreateUpdateWireServiceAllocationSettingDto;
    this.wireServiceAllocationSettingService
      .saveWireServiceAllocationSetting(formValue, applyForAllStore)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.form.patchValue(response);
          this.toaster.success('::StoreSpecificWireServiceAllocation:Saved');
        },
        error: err => {
          this.toaster.error(err.message);
        },
      });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
