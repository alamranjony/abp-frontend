import { ToasterService } from '@abp/ng.theme.shared';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { SmsTemplateDto, SmsTemplateService } from '@proxy/sms-templates';

@Component({
  selector: 'app-sms-send-dialog',
  templateUrl: './sms-send-dialog.component.html',
  styleUrl: './sms-send-dialog.component.scss',
})
export class SmsSendDialogComponent implements OnInit {
  smsForm: FormGroup;
  smsTemplates: SmsTemplateDto[];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<SmsSendDialogComponent>,
    private templateService: SmsTemplateService,
    private toaster: ToasterService,
  ) {}

  ngOnInit(): void {
    this.initSmsForm();
    this.templateService.getTemplateLookup().subscribe(res => {
      this.smsTemplates = res;
    });
  }

  private initSmsForm() {
    this.smsForm = this.fb.group({
      phoneNumber: [null, Validators.required],
      smsTemplateSystemName: [null, Validators.required],
    });
  }

  send() {
    if (this.smsForm.invalid) {
      this.smsForm.markAllAsTouched();
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }
    
    this.dialogRef.close(this.smsForm.value);
  }

  close() {
    this.dialogRef.close();
  }
}
