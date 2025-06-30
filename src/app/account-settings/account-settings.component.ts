import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AccountSettingDto, AccountSettingService } from '@proxy/account-settings';
import { ToasterService } from '@abp/ng.theme.shared';
import { CountryLookupDto, CountryService } from '@proxy/countries';
import { StateProvinceLookupDto, StateProvinceService } from '@proxy/state-provinces';
import { LocalizationService } from '@abp/ng.core';
import { MatSelectChange } from '@angular/material/select';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { DEBOUNCE_TIME } from '../shared/constants';
import { ClientStatus } from '@proxy/settings';

enum PackageType {
  Monthly = 0,
  Yearly,
}

@Component({
  selector: 'app-account-settings',
  templateUrl: './account-settings.component.html',
  styleUrl: './account-settings.component.scss',
})
export class AccountSettingsComponent implements OnInit {
  accountSetting: AccountSettingDto;
  form: FormGroup;
  currentPackageId: number;
  countries: CountryLookupDto[];
  stateProvinces: StateProvinceLookupDto[];
  clientStatusList: { value: number; text: string }[];
  packageTypes: { value: number; text: string }[];

  constructor(
    private accountSettingService: AccountSettingService,
    private fb: FormBuilder,
    private toaster: ToasterService,
    private countryService: CountryService,
    private stateProvinceService: StateProvinceService,
    private localizationService: LocalizationService,
  ) {}

  ngOnInit(): void {
    this.buildFrom();
    this.loadEnums();
    this.loadCountries();
    this.loadAccountSetting();
  }

  save() {
    if (this.form.invalid) {
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }

    const request = this.accountSettingService.saveAccountSetting(this.form.getRawValue());
    request.subscribe({
      next: () => {
        this.loadAccountSetting();
        this.toaster.success('::AccountSettingSavedSuccessfully');
      },
      error: err => {
        this.toaster.error('::AccountSettingSaveError');
      },
    });
  }

  onSubscriptionPackageChange(event: MatSelectChange) {
    this.currentPackageId = event.value;
    this.updatePackageRates();
  }

  calculate() {
    const currentPackageRate = Number(this.form.get('currentPackageRate').value);
    const userLicenseCount = Number(this.form.get('userLicenseCount').value);
    const userLicenseRate = Number(this.form.get('userLicenseRate').value);
    const seasonalLicenseCount = Number(this.form.get('seasonalLicenseCount').value);
    const seasonalLicenseRate = Number(this.form.get('seasonalLicenseRate').value);

    const total =
      currentPackageRate +
      userLicenseCount * userLicenseRate +
      seasonalLicenseCount * seasonalLicenseRate;

    this.form.get('totalSubscription').setValue(total);
  }

  private buildFrom() {
    this.form = this.fb.group({
      tenantId: [],
      clientId: [{ value: null, disabled: true }],
      storeName: [{ value: null, disabled: true }],
      accountHolder: [{ value: null, disabled: true }],
      address: [{ value: null, disabled: true }],
      addressCont: [{ value: null, disabled: true }],
      countryId: [{ value: null, disabled: true }],
      stateProvinceId: [{ value: null, disabled: true }],
      city: [{ value: null, disabled: true }],
      zipCode: [{ value: null, disabled: true }],
      email: [{ value: null, disabled: true }],
      additionalEmail: [{ value: null, disabled: true }],
      phone: [{ value: null, disabled: true }],
      additionalPhone: [{ value: null, disabled: true }],
      clientStatus: [null, Validators.required],
      packageTypeId: [{ value: PackageType.Monthly, disabled: true }],
      remainingTrialDay: [{ value: 0, disabled: true }],
      currentPackageId: [0, Validators.required],
      currentPackageRate: [0, Validators.required],
      userLicenseCount: [0, Validators.required],
      userLicenseRate: [0, Validators.required],
      seasonalLicenseCount: [0],
      seasonalLicenseRate: [0],
      noteAndHistory: [''],
      noteAndHistories: [''],
      totalSubscription: [0, Validators.required],
    });

    this.form
      .get('userLicenseCount')
      .valueChanges.pipe(debounceTime(DEBOUNCE_TIME), distinctUntilChanged())
      .subscribe((value: number) => {
        const rate = this.getUserLicenseRate(this.currentPackageId, value);
        if (rate != null) {
          this.form.get('userLicenseRate').setValue(rate);
        }
      });
  }

  private loadEnums() {
    this.clientStatusList = Object.keys(ClientStatus)
      .filter(key => isNaN(Number(key)))
      .map(key => ({
        text: this.localizationService.instant(`::Enum:ClientStatus.${ClientStatus[key]}`),
        value: ClientStatus[key] as number,
      }));

    this.packageTypes = Object.keys(PackageType)
      .filter(key => isNaN(Number(key)))
      .map(key => ({
        text: this.localizationService.instant(`::Enum:PackageType.${key}`),
        value: PackageType[key] as number,
      }));
  }

  private loadAccountSetting() {
    this.accountSettingService.getAccountSetting().subscribe(response => {
      this.accountSetting = response;
      this.currentPackageId = response.currentPackageId;
      this.form.patchValue(this.accountSetting);
      this.loadStateProvinces(this.accountSetting.countryId);
      this.updatePackageRates();
      this.calculate();
    });
  }

  private loadCountries() {
    this.countryService.getCountryLookup().subscribe(res => {
      this.countries = res.items;
    });
  }

  private loadStateProvinces(countryId: string) {
    if (countryId) {
      this.stateProvinceService.getStateProvincesByCountryId(countryId).subscribe(res => {
        this.stateProvinces = res.items;
      });
    }
  }

  private updatePackageRates() {
    const subscriptionPackage = this.accountSetting.packages.find(
      e => e.id == this.currentPackageId,
    );
    if (subscriptionPackage) {
      this.form.get('currentPackageRate').setValue(subscriptionPackage.monthlyPrice);
      this.form.get('seasonalLicenseRate').setValue(subscriptionPackage.seasonalLicenseFee);
      const userLicenseCount = this.form.get('userLicenseCount').value;
      this.form
        .get('userLicenseRate')
        .setValue(this.getUserLicenseRate(this.currentPackageId, userLicenseCount));
    }
  }

  private getUserLicenseRate(packageId: number, count: number): number {
    const licenseFeeMaps = this.accountSetting.packageUserLicenseFeeMaps[packageId];
    if (licenseFeeMaps) {
      const licenseFeeMap = licenseFeeMaps.find(e => count >= e.low && count < e.high);
      if (licenseFeeMap) {
        return licenseFeeMap.price;
      }
    }
    return 0;
  }
}
