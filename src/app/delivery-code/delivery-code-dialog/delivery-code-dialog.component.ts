import { LocalizationService } from '@abp/ng.core';
import { ToasterService } from '@abp/ng.theme.shared';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { StatusCategory } from '@proxy/deliveries';
import CreateOrUpdateDeliveryCodeModel from 'src/app/models/CreateOrUpdateDeliveryCodeModel';
import { AngularMaterialModule } from 'src/app/shared/angular-material/angular-material.module';
import { SharedModule } from 'src/app/shared/shared.module';

@Component({
  selector: 'app-delivery-code-dialog',
  standalone: true,
  imports: [AngularMaterialModule, SharedModule],
  templateUrl: './delivery-code-dialog.component.html',
  styleUrl: './delivery-code-dialog.component.scss',
})
export class DeliveryCodeDialogComponent {
  form: FormGroup;
  statusCategories: { text: string; value: number }[];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<DeliveryCodeDialogComponent>,
    public abpLocalization: LocalizationService,
    @Inject(MAT_DIALOG_DATA) public data: CreateOrUpdateDeliveryCodeModel,
    private localizationService: LocalizationService,
    private toaster: ToasterService,
  ) {
    this.statusCategories = Object.keys(StatusCategory)
      .filter(key => isNaN(Number(key)))
      .map(key => ({
        text: this.localizationService.instant(`::Enum:${key}`),
        value: StatusCategory[key] as number,
      }));

    this.form = this.fb.group({
      code: [data.code || '', Validators.required],
      shortDescription: [data.shortDescription || ''],
      longDescription: [data.longDescription || ''],
      statusCategory: [data.statusCategory || null, Validators.required],
      sendProblemBox: [data.sendProblemBox || false],
      forceSignByEntry: [data.forceSignByEntry || false],
      leftAtAddressEntry: [data.leftAtAddressEntry || false],
      phoneSystemCode: [data.phoneSystemCode || ''],
      phoneSystemMsgCode: [data.phoneSystemMsgCode || ''],
      departmentResponse: [data.departmentResponse || ''],
      wsmCode1: [data.wsmCode1 || ''],
      wsmCode2: [data.wsmCode2 || ''],
      emailFileName: [data.emailFileName || ''],
      emailSubject: [data.emailSubject || ''],
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
}
