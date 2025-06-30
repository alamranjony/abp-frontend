import { Component, OnInit } from '@angular/core';
import { numberTypeOptions } from '@proxy/phone-directories';
import { ValueDto } from '@proxy/values';
import { StoreLookupDto, StoreService } from '@proxy/stores';
import { StateProvinceLookupDto, StateProvinceService } from '@proxy/state-provinces';
import { CountryLookupDto, CountryService } from '@proxy/countries';
import { PasswordStateMatcher } from '../../shared/custom-error-state-matcher/password-state-matcher';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { CreateUpdateEmployeeDto, EmployeeDto, EmployeeService } from '@proxy/employees';
import { ActivatedRoute, Router } from '@angular/router';
import { ToasterService } from '@abp/ng.theme.shared';
import { catchError, Observable, of, switchMap, timer } from 'rxjs';
import moment from 'moment/moment';
import { map } from 'rxjs/operators';
import { IdentityRoleDto, IdentityRoleService } from '@abp/ng.identity/proxy';
import { SharedDataService } from 'src/app/pos/shared-data.service';
import { sortEnumValues } from 'src/app/shared/common-utils';

@Component({
  selector: 'app-employee-form',
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.scss',
})
export class EmployeeFormComponent implements OnInit {
  employeeForm: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  hideConfirmPin = true;
  hidePin = true;
  formSubmitted = false;
  passwordStateMatcher = new PasswordStateMatcher('passwordMismatch');
  pinStateMatcher = new PasswordStateMatcher('pinMismatch');
  countries: CountryLookupDto[];
  stateProvinces: StateProvinceLookupDto[];
  filteredStateProvinces: StateProvinceLookupDto[];
  values: ValueDto[];
  departmentValues: ValueDto[];
  stores: StoreLookupDto[];
  statusValues: ValueDto[];
  contactRelationValues: ValueDto[];
  roleValues: ValueDto[];
  phoneNumberTypeOptions = sortEnumValues(numberTypeOptions);
  id: string;
  readonly emptyGuid = '00000000-0000-0000-0000-000000000000';
  isAddMode = false;
  employee: EmployeeDto;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private countryService: CountryService,
    private stateProvinceService: StateProvinceService,
    private storeService: StoreService,
    private employeeService: EmployeeService,
    private route: ActivatedRoute,
    private router: Router,
    private toaster: ToasterService,
    private identityRoleService: IdentityRoleService,
    private sharedDataService: SharedDataService,
  ) {}

  roles: IdentityRoleDto[] = [];
  ngOnInit(): void {
    this.id = this.route.snapshot.params['id'];
    this.isAddMode = !this.id;
    this.initForm();
    this.getCountries();
    this.getStateProvinces();
    this.getValues();
    this.getStores();
    if (!this.isAddMode) this.getEmployeeDetails();
    this.getAllRoles();
  }

  initForm() {
    this.employeeForm = this.fb.group(
      {
        firstName: ['', Validators.required],
        middleName: [null],
        lastName: ['', Validators.required],
        address1: ['', Validators.required],
        address2: [''],
        city: ['', Validators.required],
        zipcode: ['', Validators.required],
        phoneNumberType: ['', Validators.required],
        phoneNumber: ['', Validators.required],
        stateProvinceId: ['', Validators.required],
        countryId: ['', Validators.required],
        hireDate: [null],
        terminationDate: [null],
        roleValueId: [null, Validators.required],
        departmentValueId: [null, Validators.required],
        statusValueId: [null, Validators.required],
        locationId: [null, Validators.required],
        payoutAmount: [null],
        isEmployeeOrderReview: [false],
        userName: ['', [Validators.required], [this.userNameValidator()]],
        displayName: [''],
        password: [
          '',
          [
            Validators.required,
            Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\W).{1,}$'),
            Validators.minLength(6),
          ],
        ],
        confirmPassword: ['', Validators.required],
        pin: ['', [Validators.required, Validators.maxLength(10)]],
        confirmPin: ['', Validators.required],
        email: ['', [Validators.email], [this.emailValidator()]],
        employeeId: ['', [Validators.required], [this.employeeIdValidator()]],
        contactPersonName: ['', Validators.required],
        contactPersonPhone: ['', Validators.required],
        contactPersonRelationValueId: ['', Validators.required],
        comment: [null],
      },
      {
        validators: [this.passwordMatchValidator, this.pinMatchValidator],
      },
    );
  }

  formatDate(date: string): string {
    return date ? moment(date).format('YYYY-MM-DD') : date;
  }

  save() {
    this.formSubmitted = true;
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }

    this.loading = true;
    const { confirmPassword, confirmPin, ...rest } = this.employeeForm.value;
    const employeeDto: CreateUpdateEmployeeDto = { ...rest };
    employeeDto.hireDate = this.formatDate(employeeDto.hireDate);
    employeeDto.terminationDate = this.formatDate(employeeDto.terminationDate);
    employeeDto.displayName = `${employeeDto.firstName} - ${employeeDto.employeeId}`;
    employeeDto.userId = this.employee?.userId;

    if (this.isAddMode) {
      this.createEmployee(employeeDto);
    } else {
      this.updateEmployee(employeeDto);
    }
  }

  createEmployee(employeeDto: CreateUpdateEmployeeDto) {
    this.employeeService.create(employeeDto).subscribe({
      next: data => {
        this.toaster.success('::EmployeeCreatedSuccessfully');
        this.router.navigate(['/employees']);
      },
      complete: () => {
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  updateEmployee(employeeDto: CreateUpdateEmployeeDto) {
    this.employeeService.update(this.id, employeeDto).subscribe({
      next: data => {
        this.toaster.success('::EmployeeUpdatedSuccessfully');
        this.router.navigate(['/employees']);
      },
      complete: () => {
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  togglePinVisibility(event: MouseEvent) {
    event.preventDefault();
    this.hidePin = !this.hidePin;
    event.stopPropagation();
  }

  togglePasswordVisibility(event: MouseEvent) {
    event.preventDefault();
    this.hidePassword = !this.hidePassword;
    event.stopPropagation();
  }

  toggleConfirmPasswordVisibility(event: MouseEvent) {
    event.preventDefault();
    this.hideConfirmPassword = !this.hideConfirmPassword;
    event.stopPropagation();
  }

  toggleConfirmPinVisibility(event: MouseEvent) {
    event.preventDefault();
    this.hideConfirmPin = !this.hideConfirmPin;
    event.stopPropagation();
  }

  passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    return password && confirmPassword && password.value !== confirmPassword.value
      ? { passwordMismatch: true }
      : null;
  };

  pinMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const pin = control.get('pin');
    const confirmPin = control.get('confirmPin');

    return pin && confirmPin && pin.value !== confirmPin.value ? { pinMismatch: true } : null;
  };

  clearHireDate() {
    this.employeeForm.get('hireDate').setValue(null);
  }

  clearTerminationDate() {
    this.employeeForm.get('terminationDate').setValue(null);
  }

  get formControls() {
    return this.employeeForm.controls;
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
      this.employeeForm.patchValue({
        stateProvinceId: null,
      });
      this.filteredStateProvinces = [];
    }
  }

  getCountries() {
    this.countryService.getCountryLookup().subscribe(res => (this.countries = res.items));
  }

  getStateProvinces() {
    this.stateProvinceService.getStateProvinceLookup().subscribe(res => {
      this.stateProvinces = this.filteredStateProvinces = res.items;

      const selectedCountryId = this.sharedDataService.corporateSettings?.countryId;
      if (!this.id && selectedCountryId) {
        this.sharedDataService.bindCorporateSelectedCountry(this.employeeForm);
        this.filteredStateProvinces = this.stateProvinces.filter(
          item => item.countryId === selectedCountryId,
        );
      }
    });
  }

  getValues() {
    this.employeeService.getEmployeeValueTypeList().subscribe(res => {
      const {
        departmentList,
        statusList,
        contactRelationList,
        roleList,
        preselectedRoleId,
        preselectedStatusId,
        preselectedDepartmentId,
        preselectedContactRelationId,
      } = res;

      this.departmentValues = departmentList;
      this.statusValues = statusList;
      this.contactRelationValues = contactRelationList;
      this.roleValues = roleList;

      if (!this.isAddMode) return;

      this.setFormValue('roleValueId', preselectedRoleId);
      this.setFormValue('statusValueId', preselectedStatusId);
      this.setFormValue('departmentValueId', preselectedDepartmentId);
      this.setFormValue('contactPersonRelationValueId', preselectedContactRelationId);
    });
  }

  private setFormValue(controlName: string, value: any) {
    if (value) {
      this.employeeForm.get(controlName)?.setValue(value);
    }
  }

  getStores() {
    this.storeService.getStoreLookup().subscribe(res => (this.stores = res.items));
  }

  getAllRoles() {
    this.identityRoleService.getAllList().subscribe(x => {
      this.roles = x.items;
    });
  }

  getEmployeeDetails() {
    this.employeeService.get(this.id).subscribe(x => {
      this.employee = x;
      this.employeeForm.get('confirmPassword')?.setValue(x.password);
      this.employeeForm.get('confirmPin')?.setValue(x.pin);
      this.employeeForm.patchValue(x);
    });
  }

  onCancel() {
    this.router.navigate(['/employees']);
  }

  employeeIdValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      return timer(1000).pipe(
        switchMap(() =>
          this.employeeIdExists(control.value).pipe(
            map(exists => (exists ? { employeeIdExists: true } : null)),
            catchError(() => of(null)),
          ),
        ),
      );
    };
  }

  emailValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      return timer(1000).pipe(
        switchMap(() =>
          this.emailExists(control.value).pipe(
            map(exists => (exists ? { emailExists: true } : null)),
            catchError(() => of(null)),
          ),
        ),
      );
    };
  }

  userNameValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      return timer(1000).pipe(
        switchMap(() =>
          this.userNameExists(control.value).pipe(
            map(exists => (exists ? { userNameExists: true } : null)),
            catchError(() => of(null)),
          ),
        ),
      );
    };
  }

  employeeIdExists(employeeId: string) {
    return this.employeeService.employeeIdExists(this.id ?? this.emptyGuid, employeeId);
  }

  emailExists(email: string) {
    return this.employeeService.emailExists(this.id ?? this.emptyGuid, email);
  }

  userNameExists(username: string) {
    return this.employeeService.userNameExists(this.id ?? this.emptyGuid, username);
  }
  get password() {
    return this.employeeForm.get('password');
  }

  get pin() {
    return this.employeeForm.get('pin');
  }
}
