import { Component, OnInit } from '@angular/core';
import { StateProvinceLookupDto, StateProvinceService } from '@proxy/state-provinces';
import { CountryLookupDto, CountryService } from '@proxy/countries';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToasterService } from '@abp/ng.theme.shared';
import { SelectListItemDto, StoreLookupDto, StoreService } from '@proxy/stores';
import { StoreWorkHourLookupDto } from '@proxy/store-work-hours';
import { EmployeeLookupDto, EmployeeService } from '@proxy/employees';
import { MatSelectChange } from '@angular/material/select';

@Component({
  selector: 'app-store-form',
  templateUrl: './store.component.html',
  styleUrl: './store.component.scss',
})
export class StoreComponent implements OnInit {
  storeForm: FormGroup;
  formSubmitted = false;
  employees: EmployeeLookupDto[];
  countries: CountryLookupDto[];
  stateProvinces: StateProvinceLookupDto[];
  stateProvinceMap: Map<string, StateProvinceLookupDto[]> = new Map<
    string,
    StateProvinceLookupDto[]
  >();
  timeZones: SelectListItemDto[];
  selectedFile: File;
  imageUrl: string;
  hasImage: boolean = false;
  stores: StoreLookupDto[] = [];
  id: string;

  constructor(
    private fb: FormBuilder,
    private countryService: CountryService,
    private stateProvinceService: StateProvinceService,
    private storeService: StoreService,
    private employeeService: EmployeeService,
    private router: Router,
    private toaster: ToasterService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.getCountries();
    this.storeService.getStoresForSelection().subscribe(response => {
      this.stores = response;
      this.id = this.stores.find(store => store.isSelected)?.id;
      this.getTimeZones();
      this.getEmployees();
      this.getStoreDetails();
    });
  }

  initForm() {
    this.storeForm = this.fb.group({
      storeName: [{ value: '', disabled: true }, Validators.required],
      tenantId: [''],
      storeCode: ['', Validators.required],
      contactName: [{ value: '', disabled: true }, Validators.required],
      email: [{ value: '', disabled: true }, Validators.required],
      addressLine1: [{ value: '', disabled: true }, Validators.required],
      addressLine2: [{ value: '', disabled: true }],
      city: [{ value: '', disabled: true }, Validators.required],
      zipCode: [{ value: '', disabled: true }, Validators.required],
      countryId: [{ value: '', disabled: true }, Validators.required],
      provinceId: [{ value: '', disabled: true }, Validators.required],
      phone: [{ value: '', disabled: true }, Validators.required],
      managerId: ['', Validators.required],
      timeZone: [{ value: '', disabled: true }, Validators.required],
      faxNumber: [{ value: '', disabled: true }, Validators.required],
      isAddOnMasDirectory: [{ value: false, disabled: true }],
      isPrimaryStore: [{ value: false, disabled: true }],
      salesTax: [0],
      isTrackInventory: [false],
      timeFormateId: [12],
      dateTimeFormate: ['MM/DD/YYYY', Validators.required],
      facebookUrl: [''],
      twitterUrl: [''],
      pinterestUrl: [''],
      addtoMasDirectoryNetwork: [false],
      receiptFooterNote: [''],
      storeWorkHours: this.fb.array([]),
      latitude: [{ value: '', disabled: true }],
      longitude: [{ value: '', disabled: true }],
    });
  }

  save() {
    this.formSubmitted = true;
    if (this.storeForm.invalid) {
      this.storeForm.markAllAsTouched();
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }

    this.storeService.update(this.id, this.storeForm.getRawValue()).subscribe({
      next: data => {
        this.toaster.success('::StoreUpdateSuccess');
        this.router.navigate(['/stores']);
      },
    });
  }

  get formControls() {
    return this.storeForm.controls;
  }

  onChangeCountry(event: MatSelectChange) {
    if (event.value) {
      this.stateProvinceService.getStateProvincesByCountryId(event.value).subscribe(result => {
        this.stateProvinces = result.items;
      });
    }
  }

  getTimeZones() {
    this.storeService.getTimeZoneLookup().subscribe(res => (this.timeZones = res.items));
  }

  getEmployees() {
    this.employeeService.getEmployeeLookup().subscribe(res => (this.employees = res.items));
  }

  getStoreDetails() {
    this.storeService.get(this.id).subscribe(result => {
      this.storeForm.patchValue(result);
      this.setStoreWorkHours(result.storeWorkHours);
      this.loadFile(this.id);
      this.getStateProvinces(result.countryId);
    });
  }

  get storeWorkHourControls() {
    return (this.storeForm.get('storeWorkHours') as FormArray).controls;
  }

  setStoreWorkHours(workHours: StoreWorkHourLookupDto[]) {
    const workHoursFGs = workHours.map(workHour => this.fb.group(workHour));
    const workHoursFormArray = this.fb.array(workHoursFGs);
    this.storeForm.setControl('storeWorkHours', workHoursFormArray);

    (this.storeForm.get('storeWorkHours') as FormArray).controls.forEach(control => {
      control.get('isClose')?.valueChanges.subscribe(isClose => {
        if (isClose) {
          control.get('startTime')?.disable();
          control.get('endTime')?.disable();
        } else {
          control.get('startTime')?.enable();
          control.get('endTime')?.enable();
        }
      });
    });
  }

  onFileChange(event) {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];

      const myFormData = new FormData();
      myFormData.append('file', this.selectedFile);
      this.storeService.uploadLogoByFileAndId(myFormData, this.id).subscribe(() => {
        this.loadFile(this.id);
      });
    }
  }

  loadFile(id: string) {
    this.storeService.getLogoById(id).subscribe(blob => {
      if (blob.size > 0) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imageUrl = e.target.result;
          this.hasImage = true;
        };
        reader.readAsDataURL(blob);
      } else {
        this.hasImage = false;
      }
    });
  }

  onStoreSelectionChange(event: MatSelectChange) {
    const store = this.stores.find(store => store.storeCode === event.value);
    if (!store) {
      this.toaster.error('::Store:NotFound');
      return;
    }
    this.id = store.id;
    this.getStoreDetails();
  }

  private getCountries() {
    this.countryService.getCountryLookup().subscribe(result => {
      this.countries = result.items;
    });
  }

  private getStateProvinces(countryId: string) {
    if (this.stateProvinceMap.has(countryId)) {
      this.stateProvinces = this.stateProvinceMap.get(countryId);
    } else {
      this.stateProvinceService.getStateProvincesByCountryId(countryId).subscribe(result => {
        this.stateProvinces = result.items;
        this.stateProvinceMap.set(countryId, result.items);
      });
    }
  }
}
