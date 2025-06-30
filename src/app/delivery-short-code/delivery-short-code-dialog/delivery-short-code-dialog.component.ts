import { LocalizationService, PagedAndSortedResultRequestDto } from '@abp/ng.core';
import { Component, Inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CountryLookupDto, CountryService } from '@proxy/countries';
import { DeliveryType, DeliveryZoneService } from '@proxy/deliveries';
import { StateProvinceLookupDto, StateProvinceService } from '@proxy/state-provinces';
import { StoreService } from '@proxy/stores';
import { AngularMaterialModule } from 'src/app/shared/angular-material/angular-material.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { catchError, forkJoin, lastValueFrom, map, Observable, of, startWith } from 'rxjs';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { ToasterService } from '@abp/ng.theme.shared';
import { AddressSuggestionDialogComponent } from '../../pos/pos-added-item/pos-add-recipient-details-dialog/address-suggestion-dialog/address-suggestion-dialog.component';
import { generateTomTomGeocodeUrl } from '../../shared/map-utils';
import { finalize } from 'rxjs/operators';
import { TomTomApiKeySettingsService } from '@proxy/tom-tom';
import { SharedDataService } from 'src/app/pos/shared-data.service';

@Component({
  selector: 'app-delivery-short-code-dialog',
  standalone: true,
  imports: [AngularMaterialModule, SharedModule, MatAutocompleteTrigger, MatAutocomplete],
  templateUrl: './delivery-short-code-dialog.component.html',
  styleUrl: './delivery-short-code-dialog.component.scss',
})
export class DeliveryShortCodeDialogComponent implements OnInit {
  form: FormGroup;
  countries: CountryLookupDto[] = [];
  filteredCountries: Observable<CountryLookupDto[]>;
  stateProvinces: StateProvinceLookupDto[] = [];
  filteredStateProvinces: Observable<StateProvinceLookupDto[]>;
  stores: { id: string; name: string }[] = [];
  zones: { id: string; name: string }[] = [];
  deliveryTypes: { id: number; name: string }[] = [];
  tomtomApiKey: string;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<DeliveryShortCodeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private countryService: CountryService,
    private stateProvinceService: StateProvinceService,
    private storeService: StoreService,
    private deliveryZoneService: DeliveryZoneService,
    private http: HttpClient,
    private handler: HttpBackend,
    private localizationService: LocalizationService,
    private toaster: ToasterService,
    private dialog: MatDialog,
    private readonly tomTomApiKeyService: TomTomApiKeySettingsService,
    private sharedDataService: SharedDataService,
  ) {
    this.http = new HttpClient(this.handler);
  }

  ngOnInit(): void {
    this.buildForm();
    this.initializeDropdowns();
    this.loadInitialValues();
  }

  async onSave(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }

    if (!(await this.isAddressValid())) {
      this.toaster.error(this.localizationService.instant('::DeliveryShortCode:ValidationFailed'));
      return;
    }
    this.setFormValueIds();
    this.dialogRef.close(this.form.getRawValue());
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onCountrySelected(country: CountryLookupDto): void {
    this.form.get('stateProvinceId').setValue(null);
    this.loadStateProvinces(country.id);
  }

  displayCountryName(country?: CountryLookupDto): string {
    return country?.name ?? '';
  }

  displayStateProvinceName(stateProvince?: StateProvinceLookupDto): string {
    return stateProvince?.name ?? '';
  }

  onUseDefaultDeliveryChargeChange(event: MatCheckboxChange): void {
    if (event.checked) {
      this.form.get('specialDeliveryCharge').disable();
    } else {
      this.form.get('specialDeliveryCharge').enable();
    }
  }

  async isAddressValid(): Promise<boolean> {
    const address = this.form.get('address1').value;
    const city = this.form.get('city').value;
    const zipCode = this.form.get('zipCode').value;
    const country = this.form.get('countryId').value.name;
    const stateProvince = this.form.get('stateProvinceId').value.name;

    const query = `${address}, ${city}, ${stateProvince}, ${country}, ${zipCode}`;
    const url = generateTomTomGeocodeUrl(query, this.tomtomApiKey);

    try {
      const response: any = await lastValueFrom(this.http.get(url));
      if (!response?.results?.length) {
        return false;
      }

      if (response.results.length > 1) {
        if (this.hasSameAddress(response.results)) {
          return true;
        }
        this.showMapDialog(response.results);
        return false;
      }
      return response.results.length == 1;
    } catch (error) {
      return false;
    }
  }

  private hasSameAddress(locations: any[]): boolean {
    const address1 = this.form.get('address1').value;
    const city = this.form.get('city').value;
    const zipCode = this.form.get('zipCode').value;
    const stateProvince = this.form.get('stateProvinceId').value.name;

    for (const location of locations) {
      if (
        location?.address?.freeformAddress.toLowerCase() === address1.toLowerCase() &&
        location?.address?.postalCode === zipCode &&
        location?.address?.municipality.toLowerCase() === city.toLowerCase() &&
        location?.address?.countrySubdivisionName === stateProvince
      ) {
        return true;
      }
    }
    return false;
  }

  async validateAddress(): Promise<void> {
    const fields = ['address1', 'city', 'zipCode', 'stateProvinceId', 'countryId'];

    for (const field of fields) {
      const control = this.form.get(field);
      if (!control.value || !control.valid) {
        control.markAsTouched();
        return;
      }
    }

    if (await this.isAddressValid()) {
      this.toaster.success(
        this.localizationService.instant('::DeliveryShortCode:ValidationSuccessful'),
      );
    } else {
      this.toaster.error(this.localizationService.instant('::DeliveryShortCode:ValidationFailed'));
    }
  }

  showMapDialog(suggestions: any[]) {
    const dialogRef = this.dialog.open(AddressSuggestionDialogComponent, {
      width: '800px',
      data: { suggestions },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.form.patchValue({
          ...result,
        });
        this.filteredStateProvinces.subscribe(stateProvinces => {
          const matchingStateProvince = stateProvinces.find(
            value => value.name.trim().toLowerCase() === result.stateProvince.trim().toLowerCase(),
          );
          if (matchingStateProvince) {
            this.form.get('stateProvinceId').setValue(matchingStateProvince);
          }
        });
      }
    });
  }

  private buildForm() {
    this.form = this.fb.group({
      code: [this.data.code || null, [Validators.required, Validators.maxLength(50)]],
      name: [this.data.name || null, [Validators.required, Validators.maxLength(500)]],
      address1: [this.data.address1 || null, [Validators.required, Validators.maxLength(500)]],
      address2: [this.data.address2 || null, [Validators.maxLength(500)]],
      countryId: [null, [Validators.required, this.validSelectionValidator()]],
      stateProvinceId: [null, [Validators.required, this.validSelectionValidator()]],
      city: [this.data.city || null, [Validators.required, Validators.maxLength(100)]],
      zipCode: [this.data.zipCode || null, [Validators.required, Validators.maxLength(10)]],
      phoneNumber: [this.data.phoneNumber || null, [Validators.maxLength(15)]],
      deliveryType: [this.data.deliveryType || null, [Validators.required]],
      specialInstruction: [this.data.specialInstruction || '', [Validators.maxLength(1000)]],
      storeId: [this.data.storeId || null],
      zoneId: [this.data.zoneId || null],
      defaultDeliveryCharge: [this.data.defaultDeliveryCharge || 0],
      useDefaultDeliveryCharge: [this.data.useDefaultDeliveryCharge || false],
      specialDeliveryCharge: [
        { value: this.data.specialDeliveryCharge, disabled: this.data.useDefaultDeliveryCharge } ||
          0,
        [Validators.required],
      ],
    });
  }

  private initializeDropdowns() {
    this.countryService.getCountryLookup().subscribe(result => {
      this.countries = result.items;
      this.setupCountryFilters();

      if (this.data.countryId) {
        this.loadSelectedCountry(this.data.countryId);
      } else {
        const selectedCountryId = this.sharedDataService.corporateSettings?.countryId;
        this.loadSelectedCountry(selectedCountryId);
      }
    });

    this.storeService.getList(new PagedAndSortedResultRequestDto()).subscribe(result => {
      this.stores = result.items.map(item => ({ id: item.id, name: item.storeName }));
    });

    this.deliveryTypes = Object.keys(DeliveryType)
      .filter(key => isNaN(Number(key)))
      .map(key => ({
        id: DeliveryType[key],
        name: '::Enum:' + key,
      }));

    this.deliveryZoneService.getList(new PagedAndSortedResultRequestDto()).subscribe(result => {
      this.zones = result.items.map(item => ({ id: item.id, name: item.name }));
    });
  }

  private loadSelectedCountry(selectedCountryId?: string) {
    const selectedCountry = this.countries.find(country => country.id === selectedCountryId);
    this.form.get('countryId').setValue(selectedCountry);
    this.loadStateProvinces(selectedCountry?.id);
  }

  private loadInitialValues() {
    if (this.data.stateProvinceId && this.data.countryId) {
      this.loadStateProvinces(this.data.countryId, this.data.stateProvinceId);
    }

    this.tomTomApiKeyService.getTomTomApiKey().subscribe(setting => {
      this.tomtomApiKey = setting.apiKey;
    });
  }

  private setupStateProvinceFilters() {
    this.filteredStateProvinces = this.form.get('stateProvinceId').valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value, this.stateProvinces)),
    );
  }

  private setupCountryFilters() {
    this.filteredCountries = this.form.get('countryId').valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value, this.countries)),
    );
  }

  private loadStateProvinces(countryId: string, selectedStateProvinceId?: string): void {
    if (!countryId) return;

    this.stateProvinceService
      .getStateProvincesByCountryId(countryId)
      .pipe(
        catchError(error => {
          this.toaster.error(
            this.localizationService.instant('::DeliveryShortCode:StateProvince:Error'),
          );
          return of({ items: [] });
        }),
      )
      .subscribe(result => {
        this.stateProvinces = result.items;
        this.setupStateProvinceFilters();

        if (selectedStateProvinceId) {
          const selectedStateProvince = result.items.find(
            stateProvince => stateProvince.id === this.data.stateProvinceId,
          );
          this.form.get('stateProvinceId').setValue(selectedStateProvince);
        }
      });
  }

  private setFormValueIds(): void {
    this.form.patchValue({
      countryId: this.form.get('countryId').value.id,
      stateProvinceId: this.form.get('stateProvinceId').value.id,
    });
  }

  private validSelectionValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const isValid = typeof control.value == 'object';
      return isValid ? null : { invalidSelection: true };
    };
  }

  private _filter(value: string | object, list: any[]): any[] {
    if (typeof value === 'object') return [];

    const filterValue = (value || '').toLowerCase();
    return list.filter(item => item.name.toLowerCase().includes(filterValue));
  }
}
