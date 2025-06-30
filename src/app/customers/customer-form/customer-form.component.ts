import { Component, OnDestroy, OnInit } from '@angular/core';
import { StateProvinceLookupDto, StateProvinceService } from '@proxy/state-provinces';
import { CountryLookupDto, CountryService } from '@proxy/countries';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {
  CustomerAccountType,
  customerAccountTypeOptions,
  CustomerDto,
  CustomerHouseAccountDto,
  CustomerHouseAccountService,
  CustomerService,
  StatementBillingCycle,
  UpdateHouseAccountConfigDto,
} from '@proxy/customers';
import { ActivatedRoute, Router } from '@angular/router';
import { ToasterService } from '@abp/ng.theme.shared';
import { EmployeeLookupDto, EmployeeService } from '@proxy/employees';
import { CUSTOMER_ENTITY, DEBOUNCE_TIME } from 'src/app/shared/constants';
import { MatRadioChange } from '@angular/material/radio';
import {
  catchError,
  debounceTime,
  map,
  Observable,
  of,
  startWith,
  Subject,
  switchMap,
  takeUntil,
} from 'rxjs';
import { ABP, LocalizationService } from '@abp/ng.core';
import { SharedDataService } from 'src/app/pos/shared-data.service';
import { CreateUpdateEmailDirectoryDto, EmailDirectoryDto } from '@proxy/email-directories';
import { CreateUpdatePhoneDirectoryDto, PhoneDirectoryDto } from '@proxy/phone-directories';
import { sortEnumValues } from 'src/app/shared/common-utils';
import { TermsCodeDto, TermsCodeService } from '@proxy/terms-codes';

@Component({
  selector: 'app-customer-form',
  templateUrl: './customer-form.component.html',
  styleUrl: './customer-form.component.scss',
})
export class CustomerFormComponent implements OnInit, OnDestroy {
  customerForm: FormGroup;
  countries: CountryLookupDto[];
  filteredCountries: Observable<CountryLookupDto[]>;
  stateProvinces: StateProvinceLookupDto[];
  filteredStateProvinces: Observable<StateProvinceLookupDto[]>;
  employees: EmployeeLookupDto[];
  selectedCustomer = {} as CustomerDto;
  id: string;
  isAddMode = false;
  entityName = CUSTOMER_ENTITY;
  saveClicked = false;
  nextCustomerId: string;
  customerAccountTypeOptions: ABP.Option<typeof CustomerAccountType>[] = sortEnumValues(
    customerAccountTypeOptions,
  );
  public CustomerAccountType = CustomerAccountType;
  customerHouseAccountDto: CustomerHouseAccountDto;
  phoneDirectoriesToBeSaved: CreateUpdatePhoneDirectoryDto[] = [];
  emailDirectoriesToBeSaved: CreateUpdateEmailDirectoryDto[] = [];
  destroy$: Subject<void> = new Subject();
  termsCodes: TermsCodeDto[] = [];

  constructor(
    private fb: FormBuilder,
    private countryService: CountryService,
    private stateProvinceService: StateProvinceService,
    private employeeService: EmployeeService,
    private customerService: CustomerService,
    private route: ActivatedRoute,
    private router: Router,
    private toaster: ToasterService,
    private localizationService: LocalizationService,
    private sharedDataService: SharedDataService,
    private houseAccountService: CustomerHouseAccountService,
    private termsCodeService: TermsCodeService,
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.params['id'];
    this.isAddMode = !this.id;

    this.customerService.getCustomerDtoValues().subscribe(res => {
      this.selectedCustomer = res;
      if (this.isAddMode) {
        this.preselectValue();
      }
    });

    this.initForm();
    this.getEmployees();
    this.loadCountries();
    this.loadAllTermsCodes();

    if (this.isAddMode) {
      this.customerService.getNextCustomerId().subscribe(result => {
        this.nextCustomerId = result;
      });
    } else {
      this.loadCustomerDetails();
      this.loadHouseAccountDetails();
    }

    this.customerForm.get('taxExempt')?.valueChanges.subscribe((taxExempt: boolean) => {
      const taxCertificationControl = this.customerForm.get('taxCertificate');
      if (taxExempt) {
        taxCertificationControl?.setValidators([Validators.required]);
      } else {
        taxCertificationControl?.clearValidators();
      }
      taxCertificationControl?.updateValueAndValidity();
    });

    this.customerForm.get('hasDeliveryCharge').valueChanges.subscribe(result => {
      const deliveryChargeControl = this.customerForm.get('deliveryCharge');

      if (result) {
        deliveryChargeControl.enable();
        deliveryChargeControl.setValidators([Validators.required]);
      } else {
        deliveryChargeControl.disable();
        deliveryChargeControl.clearValidators();
      }
      deliveryChargeControl.updateValueAndValidity();
    });

    if (this.customerForm.get('hasDeliveryCharge').value) {
      this.customerForm.get('deliveryCharge').setValidators([Validators.required]);
      this.customerForm.get('deliveryCharge').enable();
    } else {
      this.customerForm.get('deliveryCharge').disable();
    }
  }

  private loadAllTermsCodes() {
    this.termsCodeService
      .getAllTermsCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.termsCodes = response;
      });
  }

  initForm() {
    this.customerForm = this.fb.group({
      customerId: [{ value: '', disabled: !this.isAddMode }, [Validators.required]],
      entryOption: [false, Validators.required],
      name: ['', Validators.required],
      tenantId: [''],
      address1: ['', Validators.required],
      address2: [''],
      countryId: [null, [Validators.required, this.validSelectionValidator()]],
      stateProvinceId: [null, [Validators.required, this.validSelectionValidator()]],
      city: ['', Validators.required],
      zip: ['', Validators.required],
      fax: [''],
      isWholeSale: [false],
      isOptDirectoryMarketing: [false],
      statusValueId: ['', Validators.required],
      customerAccountType: [CustomerAccountType.Normal, Validators.required],
      acctClassValueId: ['', Validators.required],
      acctManagerValueId: [''],
      storeId: ['', Validators.required],
      taxExempt: [false],
      taxCertificate: [null],
      discount: [0],
      discountOnWireout: [0],
      invoicePaymentSchedulerValueId: ['', Validators.required],
      termValueId: [''],
      arStatementInvoiceTypeValueId: [''],
      priceSheetCodeValueId: [''],
      referredByValueId: [''],
      customerReference: [''],
      comment: [''],
      hasDeliveryCharge: [false],
      deliveryCharge: [{ value: '', disabled: true }, [Validators.required]],
      accountOpenDate: [null],
      lastPurchaseDate: [null],
      lastStatementDate: [null],
      lastPaymentDate: [null],
      ytdSales: [0],
      ytdAmount: [0],
      lytdSales: [0],
      lytdAmount: [0],
      lifeTimeSales: [0],
      lifeTimeSalesAmount: [0],
      ytdPayments: [0],
      lytdPayments: [0],
      lifetimePayments: [0],
      lifeTimeCreditLimit: [0],
      creditLimit: [0],
      statementBillingCycle: [StatementBillingCycle.Monthly],
      lateFeeChargeable: [true],
      termsCodeId: [null],
    });

    if (this.isAddMode) {
      this.customerForm.get('customerId').setAsyncValidators([this.customerIdValidator.bind(this)]);
    }
  }

  onSaveClick() {
    this.saveClicked = true;
    this.save();
  }

  onSaveAndContinueClick() {
    this.saveClicked = false;
    this.save();
  }

  save() {
    const deliveryChargeControl = this.customerForm.get('deliveryCharge');
    if (!deliveryChargeControl.enabled && !deliveryChargeControl.value) {
      this.customerForm.get('deliveryCharge').setValue(0);
    }

    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }

    const hasRequiredEmail = this.emailDirectoriesToBeSaved.some(x => x.isPrimary);
    if (!hasRequiredEmail) {
      this.toaster.error('::Customer:PrimaryEmailRequirementMessage');
      return;
    }

    const hasRequiredPhone = this.phoneDirectoriesToBeSaved.some(x => x.isPrimary);
    if (!hasRequiredPhone) {
      this.toaster.error('::Customer:PrimaryPhoneNumberRequirementMessage');
      return;
    }

    const formData = {
      ...this.customerForm.getRawValue(),
      customerId: Number(this.customerForm.get('customerId').value),
      countryId: this.customerForm.get('countryId').value.id,
      stateProvinceId: this.customerForm.get('stateProvinceId').value.id,
      emailDirectoryDtos: this.emailDirectoriesToBeSaved,
      phoneDirectoryDtos: this.phoneDirectoriesToBeSaved,
    };

    if (!formData.taxExempt) {
      formData.taxCertificate = null;
    }

    const request = this.isAddMode
      ? this.customerService.create(formData)
      : this.customerService.update(this.id, formData);

    request.subscribe({
      next: data => {
        const successMessage = this.isAddMode
          ? '::CustomerCreateSuccess'
          : '::CustomerUpdateSuccess';
        this.updateHouseAccountConfig();
        this.toaster.success(successMessage);
        this.componentState(data, !this.isAddMode);
      },
    });
  }

  componentState(res: any, isEdit: boolean) {
    if (this.saveClicked) {
      this.router.navigate(['/customers']);
      return;
    }
    if (isEdit) {
      let currentUrl = this.router.url;
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigate([currentUrl]);
      });
    } else {
      this.router.navigate(['customers/edit', res?.id]);
    }
  }

  onCountrySelected(country: CountryLookupDto): void {
    this.customerForm.get('stateProvinceId').setValue(null);
    this.loadStateProvinces(country.id);
  }

  displayCountryName(country?: CountryLookupDto): string {
    return country?.name ?? '';
  }

  displayStateProvinceName(stateProvince?: StateProvinceLookupDto): string {
    return stateProvince?.name ?? '';
  }

  getEmployees() {
    this.employeeService.getEmployeeLookup().subscribe(res => (this.employees = res.items));
  }

  onCancel() {
    this.router.navigate(['/customers']);
  }

  onChangeEntryOption(event: MatRadioChange) {
    const customerIdField = this.customerForm.get('customerId');
    if (event && event.value) {
      customerIdField.setValue(this.nextCustomerId);
      customerIdField.disable();
    } else {
      customerIdField.setValue('');
      customerIdField.enable();
    }
  }

  private loadCustomerDetails() {
    this.customerService.get(this.id).subscribe(customer => {
      this.customerForm.patchValue({
        ...customer,
        customerId: customer.customerId.toString(),
        accountOpenDate: customer.accountOpenDateTime
          ? new Date(customer.accountOpenDateTime)
          : null,
        lastPurchaseDate: customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate) : null,
        lastStatementDate: customer.lastStatementDate ? new Date(customer.lastStatementDate) : null,
        lastPaymentDate: customer.lastPaymentDate ? new Date(customer.lastPaymentDate) : null,
        ytdSales: 0,
        ytdAmount: customer.ytdAmount || 0,
        lytdSales: 0,
        lytdAmount: customer.lytDsalesAmount || 0,
        lifeTimeSales: 0,
        lifeTimeSalesAmount: customer.lifetimeSalesAmount || 0,
        ytdPayments: customer.ytdPayments || 0,
        lytdPayments: customer.lytdPayments || 0,
        lifetimePayments: customer.lifetimePayments || 0,
        lifeTimeCreditLimit: customer.lifetimeCreditLimit || 0,
      });
      const country = this.countries.find(country => country.id === customer.countryId);
      this.customerForm.get('countryId').setValue(country);
      this.emailDirectoriesToBeSaved = this.mapToEmailDirectoryDtos(customer?.emailDirectories);
      this.phoneDirectoriesToBeSaved = this.mapToPhoneDirectoryDtos(customer?.phoneDirectories);

      this.loadStateProvinces(customer.countryId, customer.stateProvinceId);
    });
  }

  loadHouseAccountDetails() {
    this.houseAccountService
      .getCustomerHouseAccountByCustomerId(this.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.customerHouseAccountDto = response;
        this.customerForm.patchValue({
          creditLimit: response.creditLimit,
          statementBillingCycle: response.statementBillingCycle,
          lateFeeChargeable: response.lateFeeChargeable,
          termsCodeId: response.termsCodeId,
        });
      });
  }

  private loadCountries() {
    this.countryService.getCountryLookup().subscribe(res => {
      this.countries = res.items;
      this.setupCountryFilter();

      if (!this.id && this.sharedDataService.corporateSettings) {
        const selectedCountryId = this.sharedDataService.corporateSettings?.countryId;
        const country = this.countries.find(c => c.id === selectedCountryId);
        this.customerForm.get('countryId').setValue(country);
        this.loadStateProvinces(selectedCountryId);
      }
    });
  }

  private loadStateProvinces(countryId: string, selectedStateProvinceId?: string): void {
    if (!countryId) return;

    this.stateProvinceService
      .getStateProvincesByCountryId(countryId)
      .pipe(
        catchError(error => {
          this.toaster.error(this.localizationService.instant('::Customer:StateProvince:Error'));
          return of({ items: [] });
        }),
      )
      .subscribe(result => {
        this.stateProvinces = result.items;

        this.setupStateProvinceFilter();

        if (selectedStateProvinceId) {
          const selectedStateProvince = result.items?.find(
            stateProvince => stateProvince.id === selectedStateProvinceId,
          );
          this.customerForm.get('stateProvinceId').setValue(selectedStateProvince);
        }
      });
  }

  private validSelectionValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const isValid = typeof control.value == 'object';
      return isValid ? null : { invalidSelection: true };
    };
  }

  private setupCountryFilter() {
    this.filteredCountries = this.customerForm.get('countryId').valueChanges.pipe(
      startWith(''),
      map(value => (value ? this._filter(value, this.countries) : this.countries.slice())),
    );
  }

  private setupStateProvinceFilter() {
    this.filteredStateProvinces = this.customerForm.get('stateProvinceId').valueChanges.pipe(
      startWith(''),
      map(value =>
        value ? this._filter(value, this.stateProvinces) : this.stateProvinces.slice(),
      ),
    );
  }

  private _filter(value: string | object, list: any[]): any[] {
    if (!list || list.length === 0) return [];
    if (typeof value === 'object') return [];

    const filterValue = (value || '').toLowerCase();
    return list.filter(item => item.name.toLowerCase().includes(filterValue));
  }

  private customerIdValidator(control: AbstractControl): Observable<ValidationErrors | null> {
    const customerId: string = control.value.toString();
    const errors: ValidationErrors = {};

    if (!/^[0-9]+$/.test(customerId)) {
      errors.invalidValue = true;
    }

    if (isNaN(Number(customerId)) || Number(customerId) <= 0) {
      errors.invalidValue = true;
    }

    if (Object.keys(errors).length > 0) {
      return of(errors);
    }

    return of(customerId).pipe(
      debounceTime(DEBOUNCE_TIME),
      switchMap(id =>
        this.customerService.isCustomerExist(Number(id)).pipe(
          map(isExist => (isExist ? { customerIdExist: true } : null)),
          catchError(() => of(null)),
        ),
      ),
    );
  }

  private preselectValue(): void {
    const preselect = (
      controlName: string,
      items: any[],
      condition: (item: any) => boolean = item => item.isPreSelect,
    ) => {
      const selectedId = items?.find(condition)?.id;
      this.customerForm.get(controlName).setValue(selectedId);
    };

    preselect('statusValueId', this.selectedCustomer.availableStatuses);
    preselect('acctClassValueId', this.selectedCustomer.availableAcctClasses);
    preselect('termValueId', this.selectedCustomer.availableTerms);
    preselect(
      'invoicePaymentSchedulerValueId',
      this.selectedCustomer.availableInvoicePaymentSchedule,
    );
    preselect(
      'arStatementInvoiceTypeValueId',
      this.selectedCustomer.availableARStatementInvoiceTypes,
    );
    preselect('priceSheetCodeValueId', this.selectedCustomer.availablePriceSheetCodes);
    preselect('referredByValueId', this.selectedCustomer.availableReferredBy);
  }

  updateHouseAccountConfig() {
    if (!this.customerHouseAccountDto) return;
    const creditLimit = this.customerForm.get('creditLimit').value;
    const statementBillingCycle = this.customerForm.get('statementBillingCycle').value;
    const lateFeeChargeable = this.customerForm.get('lateFeeChargeable').value;
    const termsCodeId = this.customerForm.get('termsCodeId').value;
    let updateHouseAccountConfigDto: UpdateHouseAccountConfigDto = {
      creditLimit: creditLimit,
      statementBillingCycle,
      lateFeeChargeable,
      termsCodeId,
    };

    this.houseAccountService
      .updateHouseAccountConfiguration(this.customerHouseAccountDto.id, updateHouseAccountConfigDto)
      .subscribe({});
  }

  onHandleEmailCreation(emailDirectories: CreateUpdateEmailDirectoryDto[]) {
    this.emailDirectoriesToBeSaved = emailDirectories;
  }

  private mapToEmailDirectoryDtos(items: EmailDirectoryDto[]): CreateUpdateEmailDirectoryDto[] {
    return items.map(
      ({ entityId, email, isPrimary, optOutForMarketing, optForDirectMarketing, entityName }) => ({
        entityId,
        email,
        isPrimary,
        optOutForMarketing,
        optForDirectMarketing,
        entityName,
      }),
    );
  }

  onHandlePhoneCreation(phoneDirectories: CreateUpdatePhoneDirectoryDto[]) {
    this.phoneDirectoriesToBeSaved = phoneDirectories;
  }

  private mapToPhoneDirectoryDtos(items: PhoneDirectoryDto[]): CreateUpdatePhoneDirectoryDto[] {
    return items.map(
      ({ entityId, phoneNumber, isPrimary, numberType, isAcceptTextMessage, entityName }) => ({
        entityId,
        phoneNumber,
        isPrimary,
        numberType,
        isAcceptTextMessage,
        entityName,
      }),
    );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
