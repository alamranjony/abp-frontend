import { ToasterService } from '@abp/ng.theme.shared';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { wireServiceOptions } from '@proxy/common';
import { AngularMaterialModule } from 'src/app/shared/angular-material/angular-material.module';
import { SharedModule } from 'src/app/shared/shared.module';

@Component({
  selector: 'app-wire-shop-dialog',
  standalone: true,
  imports: [AngularMaterialModule, SharedModule],
  templateUrl: './wire-shop-dialog.component.html',
  styleUrl: './wire-shop-dialog.component.scss',
})
export class WireShopDialogComponent implements OnInit {
  form: FormGroup;
  wireService = wireServiceOptions;
  wireShopform: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    public dialogRef: MatDialogRef<WireShopDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toaster: ToasterService,
  ) {}
  ngOnInit(): void {
    this.buildForm();
  }

  buildForm() {
    this.wireShopform = this.fb.group({
      account: [this.data.account || '', Validators.required],
      headquarterCode: [this.data.headquarterCode || ''],
      userId: [this.data.userId || '', Validators.required],
      password: [this.data.password || '', Validators.required],
      memberCode: [this.data.memberCode || ''],
      interfaceId: [this.data.interfaceId || ''],
      apiUrl: [this.data.apiUrl || ''],
      crossRefShopCode: [this.data.crossRefShopCode || '', Validators.required],
      floristAuthShopCode: [this.data.floristAuthShopCode || ''],
      wireServiceId: [this.data.wireServiceId || 0, Validators.required],
      isAutoForward: [this.data.isAutoForward || false],
      isConfirmReqd: [this.data.isConfirmReqd || false],
      isDefault: [this.data.isDefault || false],
    });
  }

  onSave(): void {
    if (this.wireShopform.invalid) {
      this.wireShopform.markAllAsTouched();
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }

    this.dialogRef.close(this.wireShopform.value);
  }

  onClose(): void {
    this.dialogRef.close();
  }

  get formControls() {
    return this.wireShopform.controls;
  }
}
