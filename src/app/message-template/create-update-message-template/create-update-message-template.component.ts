import { LocalizationService } from '@abp/ng.core';
import { ToasterService } from '@abp/ng.theme.shared';
import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MessageTemplateService } from '@proxy/messages';

@Component({
  selector: 'app-create-update-message-template',
  templateUrl: './create-update-message-template.component.html',
  styleUrls: ['./create-update-message-template.component.scss'],
})
export class CreateUpdateMessageTemplateComponent implements OnInit {
  messageTemplateForm: FormGroup;
  messageTemplateSystemNames: string[] = [];
  messageTemplateId: string;

  constructor(
    private messageTemplateService: MessageTemplateService,
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CreateUpdateMessageTemplateComponent>,
    public abpLocalization: LocalizationService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toaster: ToasterService,
  ) {}

  ngOnInit(): void {
    this.buildMessageTemplateForm();
    if (this.data) this.messageTemplateForm.patchValue(this.data);
    this.getTemplatesNames();
  }

  getTemplatesNames() {
    this.messageTemplateService
      .getMessageTemplateSystemNames()
      .subscribe((messageTemplateSystemNames: string[]) => {
        this.messageTemplateSystemNames = messageTemplateSystemNames;
      });
  }

  onChangeSystemName(event: any) {
    let systemName = event.value;
    if (!systemName) return;

    this.messageTemplateService
      .getAllowedTokenBySystemName(systemName)
      .subscribe((response: string[]) => {
        this.data.allowedTokens = response;
      });
  }

  buildMessageTemplateForm() {
    this.messageTemplateForm = this.fb.group({
      name: [{ value: null, disabled: this.data.isEditMode }, Validators.required],
      subject: [null, Validators.required],
      body: [null, Validators.required],
    });
  }

  onSave(): void {
    if (!this.messageTemplateForm.valid) {
      this.messageTemplateForm.markAllAsTouched();
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }
    this.dialogRef.close(this.messageTemplateForm.getRawValue());
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
