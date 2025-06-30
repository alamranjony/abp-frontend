import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StoreService } from '@proxy/stores';
import { WireService, wireServiceOptions } from '@proxy/common';
import { MatSelectChange } from '@angular/material/select';
import { ToasterService } from '@abp/ng.theme.shared';
import { CreateUpdateWireServiceSetupDto } from '@proxy/store-specific-settings/wire-services';
import { WireServiceSetupService } from '@proxy/store-specific-settings';
import { FlowerShopNetworkService } from '@proxy/wire-services/flower-shop-network';

@Component({
  selector: 'app-wire-service-setup',
  standalone: false,
  templateUrl: './wire-service-setup.component.html',
  styleUrl: './wire-service-setup.component.scss',
})
export class WireServiceSetupComponent implements OnInit {
  form: FormGroup;
  wireServices = wireServiceOptions;
  selectedWireService: WireService = WireService.Bloomnet;
  readonly WireService = WireService;

  private readonly wireServiceValidationMap: Record<WireService, string[]> = {
    [WireService.Bloomnet]: ['shopCode', 'username', 'password', 'crossRefShopCode'],
    [WireService.MasDirect]: ['shopCode', 'username', 'password', 'crossRefShopCode'],
    [WireService.Teleflora]: ['shopCode', 'username', 'password', 'crossRefShopCode'],
    [WireService.FTD]: [
      'shopCode',
      'username',
      'password',
      'crossRefShopCode',
      'memberCode',
      'interfaceId',
    ],
    [WireService.FSN]: ['accountToken', 'username', 'password', 'crossRefShopCode'],
  };

  get showAutoForward(): boolean {
    return (
      this.selectedWireService === WireService.FTD ||
      this.selectedWireService === WireService.Teleflora
    );
  }

  get showConfirmationReq(): boolean {
    return this.selectedWireService === WireService.Teleflora;
  }

  get showMemberCode(): boolean {
    return this.selectedWireService === WireService.FTD;
  }

  get showInterfaceId(): boolean {
    return this.selectedWireService === WireService.FTD;
  }

  get showAccountToken(): boolean {
    return this.selectedWireService === WireService.FSN;
  }

  get showSopCode(): boolean {
    return this.selectedWireService !== WireService.FSN;
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly storeService: StoreService,
    private readonly wireServiceSetupService: WireServiceSetupService,
    private readonly cdr: ChangeDetectorRef,
    private readonly toaster: ToasterService,
    private readonly flowerShopNetworkService: FlowerShopNetworkService,
  ) {}

  ngOnInit() {
    this.buildForm();
    this.populateFields();
  }

  onWireServiceChange(event: MatSelectChange) {
    this.selectedWireService = event.value as WireService;
    this.clearFields();
    this.configureValidation(event.value);
    this.cdr.detectChanges();
    this.populateFields();
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAsTouched();
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }

    const applyForAllStore = this.form.get('applyForAllStore').value as boolean;
    const formValue = this.form.value as CreateUpdateWireServiceSetupDto;
    this.wireServiceSetupService.saveWireServiceSetupDto(formValue, applyForAllStore).subscribe({
      next: response => {
        this.form.patchValue(response);
        this.toaster.success('Wire Service Setup Saved Successfully');
      },
      error: err => {
        this.toaster.error('Something went wrong while saving.');
      },
    });
  }

  generateToken() {
    const usernameField = this.form.get('username');
    const passwordField = this.form.get('password');

    if (usernameField.invalid || passwordField.invalid) {
      usernameField.markAsTouched();
      passwordField.markAsTouched();
      return;
    }
    this.flowerShopNetworkService
      .generateToken(usernameField.value, passwordField.value)
      .subscribe(response => {
        this.form.get('accountToken').setValue(response);
      });
  }

  private buildForm() {
    this.form = this.fb.group({
      wireService: [this.selectedWireService],
      headquarterCode: [null],
      accountToken: [null],
      shopCode: [null, [Validators.required]],
      username: [null, [Validators.required]],
      password: [null, [Validators.required]],
      crossRefShopCode: [null, [Validators.required]],
      floristAuthShopCode: [null],
      memberCode: [null],
      interfaceId: [null],
      autoForward: [null],
      confirmationReq: [null],
      applyForAllStore: [false],
    });
  }

  private populateFields() {
    this.wireServiceSetupService
      .getWireServiceSetupDto(this.selectedWireService)
      .subscribe(response => {
        this.form.patchValue(response);
      });
  }

  private clearFields() {
    Object.keys(this.form.controls).forEach(controlName => {
      if (controlName !== 'wireService') {
        this.form.get(controlName).reset();
      }
    });
  }

  private configureValidation(wireService: WireService) {
    Object.keys(this.form.controls).forEach(controlName => {
      this.form.get(controlName).clearValidators();
      this.form.get(controlName).updateValueAndValidity();
    });

    const requiredFields = this.wireServiceValidationMap[wireService] || [];
    requiredFields.forEach(fieldName => {
      const control = this.form.get(fieldName);
      if (control) {
        control.setValidators([Validators.required]);
        control.updateValueAndValidity();
      }
    });
  }
}
