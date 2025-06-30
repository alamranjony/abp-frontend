import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToasterService } from '@abp/ng.theme.shared';
import { ValueTypeSettingService } from '@proxy/value-type-settings';
import { ValueTypeLookupDto, ValueTypeService } from '@proxy/values';

@Component({
  selector: 'app-value-type-settings',
  templateUrl: './value-type-settings.component.html',
  styleUrl: './value-type-settings.component.scss',
})
export class ValueTypeSettingsComponent implements OnInit {
  form: FormGroup;
  valueTypes$: ValueTypeLookupDto[];

  constructor(
    private valueTypeSettingService: ValueTypeSettingService,
    private valueTypeService: ValueTypeService,
    private fb: FormBuilder,
    private toaster: ToasterService,
  ) {
    valueTypeService.getValueTypeLookup().subscribe(res => (this.valueTypes$ = res.items));
    this.buildFrom();
  }

  ngOnInit(): void {
    this.getValueTypeSetting();
  }

  getValueTypeSetting() {
    this.valueTypeSettingService.getValueTypeSetting().subscribe(valueTypeSetting => {
      this.form.patchValue(valueTypeSetting);
    });
  }

  buildFrom() {
    this.form = this.fb.group({
      tenantId: [''],
      customerSettings: this.fb.group({
        status: [null, Validators.required],
        acctClass: [null, Validators.required],
        acctManager: [null, Validators.required],
        invoicePaymentSchedule: [null, Validators.required],
        arStatementInvoiceType: [null, Validators.required],
        priceSheetCode: [null, Validators.required],
        referredBy: [null, Validators.required],
      }),
      productSettings: this.fb.group({
        productType: [null, Validators.required],
        department: [null, Validators.required],
        careCode: [null, Validators.required],
      }),
      employeeSettings: this.fb.group({
        status: [null, Validators.required],
        department: [null, Validators.required],
        role: [null, Validators.required],
        contactPersonRelation: [null, Validators.required],
      }),
      vehicleSettings: this.fb.group({
        status: [null, Validators.required],
      }),
      giftCardSettings: this.fb.group({
        reason: [null, Validators.required],
      }),
      orderSettings: this.fb.group({
        tip: [null, Validators.required],
        miscIncomeReason: [null, Validators.required],
        paidOutReason: [null, Validators.required],
        cancelSaleReason: [null, Validators.required],
        replacementReason: [null, Validators.required],
        orderTypesForPrintingOverride: [null, Validators.required],
      }),
    });
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }

    const request = this.valueTypeSettingService.saveValueTypeSetting(this.form.value);
    request.subscribe({
      next: () => {
        this.getValueTypeSetting();
        this.toaster.success('::ValueTypeSettingSavedSuccessfully');
      },
      error: err => {
        this.toaster.error('::ValueTypeSettingSaveError');
      },
    });
  }
}
