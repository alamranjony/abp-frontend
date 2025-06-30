import { ToasterService } from '@abp/ng.theme.shared';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { TenantEmailSettingService } from '@proxy/tenant-email-settings';

@Component({
  selector: 'app-tenant-email-settings',
  templateUrl: './tenant-email-settings.component.html',
  styleUrls: ['./tenant-email-settings.component.scss'],
})
export class TenantEmailSettingsComponent implements OnInit {
  hideSecretKey: boolean = true;
  form: FormGroup;
  sendTestMailForm: FormGroup;

  constructor(
    private tenantEmailSettingService: TenantEmailSettingService,
    private fb: FormBuilder,
    private toaster: ToasterService,
  ) {
    this.buildTenantSettingsForm();
  }

  ngOnInit(): void {
    this.getTenantEmailSettings();
    this.buildSendTestMailForm();
  }

  getTenantEmailSettings() {
    this.tenantEmailSettingService.getTenantEmailSettings().subscribe(emailSettings => {
      this.form.patchValue(emailSettings);
    });
  }

  buildTenantSettingsForm() {
    this.form = this.fb.group({
      secretKey: [null, Validators.required],
      defaultFromAddress: [null, [Validators.required, Validators.email]],
      defaultFromDisplayName: [null, Validators.required],
    });
  }

  buildSendTestMailForm() {
    this.sendTestMailForm = this.fb.group({
      targetEmailAddress: [null, [Validators.required, Validators.email]],
    });
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }

    this.tenantEmailSettingService.saveTenantEmailSettings(this.form.value).subscribe({
      next: () => {
        this.getTenantEmailSettings();
        this.toaster.success('::TenantEmailSettingsSaveSuccessMessage');
      },
      error: err => {
        this.toaster.error('::TenantEmailSettingsSaveErrorMessage');
      },
    });
  }

  onClickSendTestMailBtn() {
    if (this.sendTestMailForm.invalid) {
      this.form.markAllAsTouched();
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }

    this.tenantEmailSettingService.sendTestMail(this.sendTestMailForm.value).subscribe({
      next: () => {
        this.toaster.success('::SendTestEmailSuccessMessage');
      },
      error: () => {
        this.toaster.error('::SendTestEmailErrorMessage');
      },
    });
  }
}
