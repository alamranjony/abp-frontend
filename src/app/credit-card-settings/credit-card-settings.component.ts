import { ToasterService } from '@abp/ng.theme.shared';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { CreditCardSettingService } from '@proxy/credit-card-settings';

@Component({
  selector: 'app-credit-card-settings',
  templateUrl: './credit-card-settings.component.html',
  styleUrls: ['./credit-card-settings.component.scss'],
})
export class CreditCardSettingsComponent implements OnInit {
  form: FormGroup;
  hidePublicKey: boolean = true;
  hideSecretKey: boolean = true;

  constructor(
    private readonly fb: FormBuilder,
    private creditCardSettingService: CreditCardSettingService,
    private toaster: ToasterService,
  ) {
    this.form = this.fb.group({
      publicKey: [null, [Validators.required, Validators.minLength(5), Validators.maxLength(255)]],
      secretKey: [null, [Validators.required, Validators.minLength(5), Validators.maxLength(255)]],
      developerId: [null, [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
      versionNumber: [null, [Validators.maxLength(4)]],
      serviceUrl: [null, [Validators.required, this.urlValidator()]],
      americanExpressAccepted: [false],
      visaAccepted: [false],
      masterCardAccepted: [false],
      dinersClubAccepted: [false],
      discoverAccepted: [false],
    });
  }

  ngOnInit(): void {
    this.getCreditCardSettings();
  }

  getCreditCardSettings() {
    this.creditCardSettingService.getCreditCardSetting().subscribe(response => {
      this.form.patchValue(response);
    });
  }

  saveCreditCardSettings() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }

    const request = this.creditCardSettingService.saveCreditCardSetting(this.form.value);
    request.subscribe({
      next: () => {
        this.getCreditCardSettings();
        this.toaster.success('Saved successfully');
      },
      error: err => {
        this.toaster.error(err.message || 'Failed to save');
      },
    });
  }

  private urlValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,6})(:[0-9]{1,5})?(\/.*)?$/;
      const isValid = urlPattern.test(control.value);
      return isValid ? null : { invalidUrl: true };
    };
  }
}
