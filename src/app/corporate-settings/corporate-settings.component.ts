import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  CorporateSettingService,
  customerAccountInfoUpdateTypeOptions,
  geoCodingPreferenceTypeOptions,
  inventoryTrackingTypeOptions,
  printNoteCardTypeOptions,
  recipeInventoryManageTypeOptions,
} from '@proxy/corporate-settings';
import { ToasterService } from '@abp/ng.theme.shared';
import { StoreLookupDto, StoreService } from '@proxy/stores';
import { CreditStatusNotAllowedToChargeOptions } from './credit-status-not-allowed-to-charge-options';
import { CustomerDto, CustomerService } from '@proxy/customers';
import { Subject, takeUntil } from 'rxjs';
import { CountryLookupDto, CountryService } from '@proxy/countries';
import { SharedDataService } from '../pos/shared-data.service';
import { sortEnumValues } from '../shared/common-utils';

@Component({
  selector: 'app-corporate-settings',
  templateUrl: './corporate-settings.component.html',
  styleUrl: './corporate-settings.component.scss',
})
export class CorporateSettingsComponent implements OnInit, OnDestroy {
  form: FormGroup;
  geoCodingTypes = sortEnumValues(geoCodingPreferenceTypeOptions);
  accountUpdateTypes = sortEnumValues(customerAccountInfoUpdateTypeOptions);
  inventoryTrackingTypes = sortEnumValues(inventoryTrackingTypeOptions);
  creditStatusNotAllowedToChargeOptions = CreditStatusNotAllowedToChargeOptions;
  printNoteCardTypeOptions = sortEnumValues(printNoteCardTypeOptions);
  stores: StoreLookupDto[];
  recipeInventoryManageTypes = sortEnumValues(recipeInventoryManageTypeOptions);
  customers: CustomerDto[] = [];
  customerSelectionBoxDisplayName = '';
  destroy$: Subject<void> = new Subject();
  countries: CountryLookupDto[];
  hideApiKey: boolean = true;

  constructor(
    private corporateSettingService: CorporateSettingService,
    private storeService: StoreService,
    private fb: FormBuilder,
    private toaster: ToasterService,
    private customerService: CustomerService,
    private countryService: CountryService,
    private sharedDataService: SharedDataService,
  ) {
    this.buildFrom();
    this.loadCountries();
  }

  ngOnInit(): void {
    this.getCorporateSetting();
    this.getStores();
    this.getCustomers();
  }

  getCorporateSetting() {
    this.corporateSettingService
      .getCorporateSetting()
      .pipe(takeUntil(this.destroy$))
      .subscribe(corporateSetting => {
        this.form.patchValue(corporateSetting);
        this.onCustomerSelectionChange();
        this.sharedDataService.setCorporateSettings(corporateSetting);
      });
  }

  getCustomers() {
    this.customerService
      .fetchCustomerDtos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.customers = res;
          this.onCustomerSelectionChange();
        },
        error: () => {
          this.customers = [];
        },
      });
  }

  onCustomerSelectionChange() {
    const selectedCustomers = this.form.get('corporateCustomers')?.value || [];
    const selectedCustomersLength = selectedCustomers.length;

    if (selectedCustomersLength <= 0) {
      this.customerSelectionBoxDisplayName = '';
      return;
    }

    const firstSelectedCustomerId = selectedCustomers[0];
    const firstSelectedCustomerName =
      this.customers?.find(customer => customer.id === firstSelectedCustomerId)?.name ?? '';

    const additionalCount = selectedCustomersLength - 1;
    const additionalText =
      additionalCount > 0
        ? `(+${additionalCount} ${additionalCount === 1 ? 'other' : 'others'})`
        : '';

    this.customerSelectionBoxDisplayName = `${firstSelectedCustomerName} ${additionalText}`;
  }

  buildFrom() {
    this.form = this.fb.group({
      tenantId: [''],
      wireOutOrderHoldTime: [0, Validators.required],
      printRawCommMessage: [false, Validators.required],
      geocodingPreferenceType: [0, Validators.required],
      updateQuantityCommittedDays: [0, Validators.required],
      passwordResetDays: [0],
      returnWindowDays: [0],
      allowCOD: [false, Validators.required],
      allowCashOrderEdits: [false, Validators.required],
      startingCustomerId: [0, Validators.required],
      startingOrderId: [0, Validators.required],
      printNoteCardType: [0, Validators.required],
      returnedCheckFee: [0],
      creditStatusNotAllowedToCharge: [0, Validators.required],
      fulfillingStoreId: [0],
      inventoryTrackingType: [0, Validators.required],
      applyCreditCardSetupToAllStores: [false],
      relayFee: [0],
      overseasRelayFee: [0],
      wireOutDeliveryFee: [0],
      taxOnDelivery: [false, Validators.required],
      taxOnRelay: [false, Validators.required],
      salesTaxPercentage: [0],
      funeralRequired: [false, Validators.required],
      hospitalRequired: [false, Validators.required],
      printFuneralReviewCopy: [false],
      printHospitalReviewCopy: [false],
      customerAccountInfoUpdateType: [0],
      auditLogEmails: [''],
      enableDiscountOnOrderItemSubtotal: [true],
      creditCardFee: [0],
      enabledCreditCardFeeOnPosOrder: [false],
      allowPartialPayment: [true],
      recipeInventoryManageType: [1],
      emailForErrorLog: [null, [Validators.email]],
      enableCarryForwardNormalGiftCardBalance: [false],
      corporateCustomers: [[]],
      maxIdleTimeBeforeSessionTimeout: ['', [Validators.required]],
      countryId: [],
      taxOnBusinessLocation: [false],
      taxOnMerchandise: [false],
      minOrderAmount: [0, Validators.required],
      printNodeApiKey: [null],
      termsAndConditions: [null],
      printReceiptMessage: [null],
      printInvoiceMessage: [null],
      cutOffTime: [0],
      hotOrderThresholdInHour: [0, Validators.required],
    });
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toaster.error('::ValidationError:InvalidFormOrData');
    } else {
      const request = this.corporateSettingService.saveCorporateSetting(this.form.value);
      request.pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.getCorporateSetting();
          this.toaster.success('::CorporateSetting.CorporateSettingSavedSuccessfully');
        },
        error: err => {
          this.toaster.error('::CorporateSetting.CorporateSettingSaveError');
        },
      });
    }
  }

  getStores() {
    this.storeService.getStoreLookup().subscribe(res => (this.stores = res.items));
  }

  private loadCountries() {
    this.countryService.getCountryLookup().subscribe(res => {
      this.countries = res.items;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
