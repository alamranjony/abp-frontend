import { LocalizationService } from '@abp/ng.core';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AngularMaterialModule } from 'src/app/shared/angular-material/angular-material.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { SmsTemplateDto, SmsTemplateService } from '@proxy/sms-templates';
import { ToasterService } from '@abp/ng.theme.shared';

@Component({
  selector: 'app-delivery-code-dialog',
  standalone: true,
  imports: [AngularMaterialModule, SharedModule],
  templateUrl: './sms-template-dialogue.component.html',
  styleUrl: './sms-template-dialogue.component.scss',
})
export class SmsTemplateDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<SmsTemplateDialogComponent>,
    public abpLocalization: LocalizationService,
    private smsTemplateService: SmsTemplateService,
    private toasterService: ToasterService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.form = this.fb.group({
      displayName: [data.displayName || '', Validators.required],
      systemName: [data.systemName || '', Validators.required],
      templateContent: [data.templateContent || '', Validators.required],
    });
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toasterService.error('::ValidationError:InvalidFormOrData');
      return;
    }
    
    if (this.data.isEditMode) {
      this.dialogRef.close(this.form.value);
      return;
    }

    this.smsTemplateService
      .isSystemNameExistBySystemName(this.form.value.systemName)
      .subscribe(response => {
        if (response) {
          this.toasterService.error('::SystemNameAlreadyExists');
        } else {
          this.dialogRef.close(this.form.value);
        }
      });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
