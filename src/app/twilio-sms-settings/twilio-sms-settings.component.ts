import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToasterService } from '@abp/ng.theme.shared';
import { TwilioSmsService, TwilioSmsSettingService } from '@proxy/twilio-sms-settings';
import { MatDialog } from '@angular/material/dialog';
import { SmsSendDialogComponent } from './sms-send-dialog/sms-send-dialog.component';
import {
  DIALOG_ENTER_ANIMATION_DURATION,
  DIALOG_EXIT_ANIMATION_DURATION,
} from '../shared/dialog.constants';

@Component({
  selector: 'app-twilio-sms-settings',
  templateUrl: './twilio-sms-settings.component.html',
  styleUrl: './twilio-sms-settings.component.scss',
})
export class TwilioSmsSettingsComponent implements OnInit {
  form: FormGroup;
  constructor(
    private fb: FormBuilder,
    private smsSettingService: TwilioSmsSettingService,
    private toaster: ToasterService,
    private dialog: MatDialog,
    private smsService: TwilioSmsService,
  ) {}
  ngOnInit(): void {
    this.initForm();
    this.getSmsSettings();
  }

  initForm() {
    this.form = this.fb.group({
      accountSID: [null, Validators.required],
      authToken: [null, Validators.required],
      fromPhoneNumber: [null, Validators.required],
    });
  }

  getSmsSettings() {
    this.smsSettingService.getTwilioSmsSettings().subscribe(res => {
      this.form.patchValue(res);
    });
  }

  saveSmsSettings() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }

    const request = this.smsSettingService.saveTwilioSmsSettings(this.form.value);
    request.subscribe({
      next: () => {
        this.getSmsSettings();
        this.toaster.success('::TwilioSmsSettings:SavedSuccessfully');
      },
      error: () => {
        this.toaster.error('::TwilioSmsSettings:SaveError');
      },
    });
  }

  sendSms() {
    const dialogRef = this.dialog.open(SmsSendDialogComponent, {
      width: '40%',
      enterAnimationDuration: DIALOG_ENTER_ANIMATION_DURATION,
      exitAnimationDuration: DIALOG_EXIT_ANIMATION_DURATION,
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.smsService.sendSms(result).subscribe({
          next: deliveryZoneDto => {
            this.toaster.success('::TwilioSms.Send.Success');
          },
          error: () => {
            this.toaster.error('::TwilioSms.Send.Error');
          },
        });
      }
    });
  }
}
