import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CountryLookupDto, CountryService } from '@proxy/countries';
import {
  CreateUpdateCustomerDto,
  CustomerAccountType,
  CustomerDto,
  CustomerService,
} from '@proxy/customers';
import { StateProvinceLookupDto, StateProvinceService } from '@proxy/state-provinces';
import { ValueDto } from '@proxy/values';
import { AbpLocalStorageService, LocalizationService } from '@abp/ng.core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  CreateUpdatePhoneDirectoryDto,
  NumberType,
  numberTypeOptions,
} from '@proxy/phone-directories';
import { DialogUtilService } from 'src/app/shared/dialog-util.service';
import { PhoneDirectoryDialogComponent } from 'src/app/phone-directory/phone-directory-dialog/phone-directory-dialog.component';
import { ToasterService } from '@abp/ng.theme.shared';
import { CreateUpdateEmailDirectoryDto } from '@proxy/email-directories';
import { EmailDirectoryDialogComponent } from 'src/app/email-directory/email-directory-dialog/email-directory-dialog.component';
import { OrderSummary } from '../models/order-summary.model';
import { SharedDataService } from '../shared-data.service';
import { sortEnumValues } from 'src/app/shared/common-utils';

@Component({
  selector: 'app-add-customer-popup',
  templateUrl: './add-customer-popup.component.html',
  styleUrls: ['./add-customer-popup.component.scss'],
})
export class AddCustomerPopupComponent implements OnInit {
  form: FormGroup;
  customerValues: CustomerDto;
  statusValues: ValueDto[];
  countries: CountryLookupDto[];
  stateProvinces: StateProvinceLookupDto[];
  filteredStateProvinces: StateProvinceLookupDto[];
  emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

  columns: string[] = ['phoneNumber', 'isPrimary', 'isAcceptTextMessage', 'actions'];
  emailTableColumns: string[] = [
    'email',
    'isPrimary',
    'optOutForMarketing',
    'optForDirectMarketing',
    'actions',
  ];

  phoneDirectoriesToBeSaved: CreateUpdatePhoneDirectoryDto[] = [];
  emailDirectoriesToBeSaved: CreateUpdateEmailDirectoryDto[] = [];
  phoneNumberTypeOptions = sortEnumValues(numberTypeOptions);
  customerIdToBeEdited: string;
  customerDto: CustomerDto;
  orderSummary: OrderSummary;

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private countryService: CountryService,
    private stateProvinceService: StateProvinceService,
    private localStorageService: AbpLocalStorageService,
    public dialogRef: MatDialogRef<AddCustomerPopupComponent>,
    private dialogUtil: DialogUtilService,
    private toasterService: ToasterService,
    private sharedDataService: SharedDataService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly localizationService: LocalizationService,
  ) {
    this.customerIdToBeEdited = data?.customerId;
  }

  ngOnInit(): void {
    this.countryService.getCountryLookup().subscribe(response => (this.countries = response.items));
    this.stateProvinceService.getStateProvinceLookup().subscribe(response => {
      this.stateProvinces = this.filteredStateProvinces = response.items;

      const selectedCountryId = this.sharedDataService.corporateSettings?.countryId;
      if (!this.customerIdToBeEdited && selectedCountryId) {
        this.sharedDataService.bindCorporateSelectedCountry(this.form);
        this.filteredStateProvinces = this.stateProvinces.filter(
          item => item.countryId === selectedCountryId,
        );
      }
    });

    this.buildForm();
    if (this.customerIdToBeEdited) this.getCustomerById(this.customerIdToBeEdited);

    this.customerService.getCustomerDtoValues().subscribe(response => {
      this.customerValues = response;
    });

    this.form.get('taxExempt')?.valueChanges.subscribe((taxExempt: boolean) => {
      const taxCertificationControl = this.form.get('taxCertificate');
      if (taxExempt) {
        taxCertificationControl?.setValidators([Validators.required]);
      } else {
        taxCertificationControl?.clearValidators();
      }
      taxCertificationControl?.updateValueAndValidity();
    });

    this.sharedDataService.orderSummary.subscribe(orderSummary => {
      this.orderSummary = orderSummary;
    });
  }

  private buildForm() {
    this.form = this.fb.group({
      name: [null, Validators.required],
      address1: [null, Validators.required],
      address2: [null],
      countryId: [null, Validators.required],
      stateProvinceId: [null, Validators.required],
      city: [null, Validators.required],
      zip: [null, Validators.required],
      fax: [null],
      email: [null],
      phoneNumberType: [NumberType.Work],
      phoneNumber: [null],
      customerReference: [''],
      taxExempt: [false],
      taxCertificate: [null],
    });
  }

  getCustomerById(customerId: string) {
    this.customerService.get(this.customerIdToBeEdited).subscribe(customerData => {
      this.customerDto = customerData;
      this.form.patchValue(customerData);
      this.phoneDirectoriesToBeSaved = customerData.phoneDirectories.map(x => {
        return { ...x } as CreateUpdatePhoneDirectoryDto;
      });
      this.emailDirectoriesToBeSaved = customerData.emailDirectories.map(x => {
        return { ...x } as CreateUpdateEmailDirectoryDto;
      });
    });
  }

  onChangeCountry(event: any) {
    if (event) {
      const selectedCountryId = event.id;
      if (!selectedCountryId) {
        return;
      }

      this.filteredStateProvinces = this.stateProvinces.filter(
        item => item.countryId === selectedCountryId,
      );
    } else {
      this.form.patchValue({
        stateProvinceId: null,
      });
      this.filteredStateProvinces = [];
    }
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toasterService.error('::ValidationError:InvalidFormOrData');
      return;
    }

    const hasRequiredPhone = this.phoneDirectoriesToBeSaved.some(x => x.isPrimary);

    if (!hasRequiredPhone) {
      this.toasterService.error('::Customer:PrimaryPhoneNumberRequirementMessage');
      return;
    }

    const acctClassDefaultValueText = this.localizationService.instant(
      '::Customer:AcctClassDefaultValue',
    );
    const defaultAcctValue = this.customerValues.availableAcctClasses.find(
      c => c.name === acctClassDefaultValueText,
    )?.id;

    let createCustomerDto = this.form.value as CreateUpdateCustomerDto;
    createCustomerDto.phoneDirectoryDtos = this.phoneDirectoriesToBeSaved;
    createCustomerDto.emailDirectoryDtos = this.emailDirectoriesToBeSaved;
    createCustomerDto.statusValueId = this.customerValues.availableStatuses.find(
      x => x.name.trim()?.toLowerCase() == 'active',
    )?.id;
    createCustomerDto.acctClassValueId = defaultAcctValue;
    createCustomerDto.storeId = this.customerValues.availableStores[0]?.id;
    createCustomerDto.invoicePaymentSchedulerValueId =
      this.customerValues.availableInvoicePaymentSchedule[0]?.id;
    createCustomerDto.termValueId = this.customerValues.availableTerms[0]?.id;
    createCustomerDto.taxCertificate = createCustomerDto.taxExempt
      ? createCustomerDto.taxCertificate.trim()
      : null;
    createCustomerDto.customerAccountType = CustomerAccountType.Normal;
    if (!this.customerDto?.id) this.createCustomer(createCustomerDto);
    else this.updateCustomer(this.customerDto?.id, createCustomerDto);
  }

  createCustomer(createCustomerDto: CreateUpdateCustomerDto) {
    this.customerService.createCustomerFromPOS(createCustomerDto).subscribe({
      next: (x: CustomerDto) => {
        this.localStorageService.setItem('customer', JSON.stringify(x));
        this.toasterService.success('::Customer:CustomerCreateSuccess');
        this.dialogRef.close('added');
      },
      error: () => {
        this.toasterService.error('::Customer:CustomerSaveErrorMessage');
      },
    });
  }

  updateCustomer(customerId: string, createCustomerDto: CreateUpdateCustomerDto) {
    createCustomerDto.customerId = parseInt(this.customerDto.customerId);

    this.customerService.updateCustomerFromPOS(customerId, createCustomerDto).subscribe({
      next: (x: CustomerDto) => {
        this.localStorageService.setItem('customer', JSON.stringify(x));
        this.toasterService.success('::Customer:CustomerUpdateSuccess');
        this.dialogRef.close('added');
      },
      error: () => {
        this.toasterService.error('::Customer:CustomerSaveErrorMessage');
      },
    });
  }

  close() {
    this.dialogRef.close('closeCustomerPopup');
  }

  editPhone(phoneNumber: string) {
    let result = this.phoneDirectoriesToBeSaved.find(x => x.phoneNumber === phoneNumber);
    const dialogRef = this.dialogUtil.openDialog(PhoneDirectoryDialogComponent, {
      ...result,
      isEditMode: false,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.phoneDirectoriesToBeSaved = this.phoneDirectoriesToBeSaved.map(phoneDirectory => {
          if (phoneDirectory.phoneNumber === phoneNumber) {
            phoneDirectory = result;
          }
          return phoneDirectory;
        });
        this.phoneDirectoriesToBeSaved = [...this.phoneDirectoriesToBeSaved];
      }
    });
  }

  delete(phoneNumber: string) {
    this.phoneDirectoriesToBeSaved = this.phoneDirectoriesToBeSaved.filter(
      x => x.phoneNumber !== phoneNumber,
    );
  }

  addPhoneNumberToPhoneDirectories() {
    const phoneNumber = this.form.get('phoneNumber')?.value;
    if (!phoneNumber?.trim()) return;
    const phoneNumberType = this.form.get('phoneNumberType')?.value;
    if (phoneNumberType === undefined || phoneNumberType === null) {
      this.toasterService.error('::Customer:EnterPhoneType');
      return;
    }
    const phoneExist = this.phoneDirectoriesToBeSaved.some(x => x.phoneNumber === phoneNumber);
    if (phoneExist) {
      this.form.get('phoneNumber')?.reset();
      this.toasterService.error('::Customer:PhoneAlreadyExist');
      return;
    }

    let phoneDirectory = {
      phoneNumber: phoneNumber,
      isPrimary: true,
      isAcceptTextMessage: false,
      numberType: Number(this.form.get('phoneNumberType')?.value),
    } as CreateUpdatePhoneDirectoryDto;

    this.phoneDirectoriesToBeSaved = [...this.phoneDirectoriesToBeSaved, phoneDirectory];
    this.form.get('phoneNumber')?.reset();
  }

  editEmail(email: string) {
    let result = this.emailDirectoriesToBeSaved.find(x => x.email === email);
    const dialogRef = this.dialogUtil.openDialog(EmailDirectoryDialogComponent, {
      ...result,
      isEditMode: false,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.emailDirectoriesToBeSaved = this.emailDirectoriesToBeSaved.map(emailDirectory => {
          if (emailDirectory.email === email) {
            emailDirectory = result;
          }
          return emailDirectory;
        });
        this.emailDirectoriesToBeSaved = [...this.emailDirectoriesToBeSaved];
      }
    });
  }

  deleteEmail(email: string) {
    this.emailDirectoriesToBeSaved = this.emailDirectoriesToBeSaved.filter(
      emailDirectory => emailDirectory.email !== email,
    );
  }

  addEmailToEmailDirectories() {
    const emailControl = this.form.get('email');
    const email = emailControl?.value?.trim();
    if (!email) return;

    if (email && !this.emailPattern.test(email)) {
      this.toasterService.error('::Error:InvalidEmail');
      this.form.get('email')?.reset();
      return;
    }

    const emailExist = this.emailDirectoriesToBeSaved.some(x => x.email === email);
    if (emailExist) {
      this.form.get('email')?.reset();
      this.toasterService.error('::Customer:EmailAlreadyExist');
      return;
    }

    let emailDirectory = {
      email: email,
      isPrimary: false,
      isAcceptTextMessage: false,
      optOutForMarketing: false,
      optForDirectMarketing: false,
    } as CreateUpdateEmailDirectoryDto;

    this.emailDirectoriesToBeSaved = [...this.emailDirectoriesToBeSaved, emailDirectory];
    this.form.get('email')?.reset();
  }
}
