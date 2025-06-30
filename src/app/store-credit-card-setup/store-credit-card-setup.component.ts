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
import { CreditCardSetupService } from '@proxy/store-specific-settings';

@Component({
  selector: 'app-store-credit-card-setup',
  templateUrl: './store-credit-card-setup.component.html',
  styleUrls: ['./store-credit-card-setup.component.scss'],
})
export class StoreCreditCardSetupComponent implements OnInit {
  form: FormGroup;
  hidePublicKey: boolean = true;
  hideSecretKey: boolean = true;

  constructor(
    private readonly fb: FormBuilder,
    private creditCardSetupService: CreditCardSetupService,
    private toaster: ToasterService,
  ) {}

  ngOnInit(): void {
    this.getCreditCardSetup();
    this.initializeForm();
  }

  getCreditCardSetup() {
    this.creditCardSetupService.getCreditCardSetup().subscribe(response => {
      this.form.patchValue(response);
    });
  }

  saveCreditCardSetup() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }

    const request = this.creditCardSetupService.saveCreditCardSetup(this.form.value);
    request.subscribe({
      next: creditCardSetupDto => {
        this.form.patchValue(creditCardSetupDto);
        this.toaster.success('::StoreSpecificCreditCardSetup:Save');
      },
      error: err => {
        this.toaster.error(err.message);
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

  private initializeForm() {
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
}
