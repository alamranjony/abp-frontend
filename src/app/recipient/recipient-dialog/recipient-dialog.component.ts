import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CountryLookupDto, CountryService } from '@proxy/countries';
import { CreateUpdateRecipientDto, locationTypeOptions } from '@proxy/recipients';
import { numberTypeOptions } from '@proxy/phone-directories';
import { StateProvinceLookupDto, StateProvinceService } from '@proxy/state-provinces';
import { SharedDataService } from 'src/app/pos/shared-data.service';
import { ToasterService } from '@abp/ng.theme.shared';

@Component({
  selector: 'app-recipient-dialog',
  templateUrl: './recipient-dialog.component.html',
  styleUrls: ['./recipient-dialog.component.scss'],
})
export class RecipientDialogComponent {
  form: FormGroup;
  countries: CountryLookupDto[];
  stateProvinces: StateProvinceLookupDto[];
  filteredStateProvinces: StateProvinceLookupDto[];
  locationTypes = locationTypeOptions;
  phoneTypes = numberTypeOptions;

  constructor(
    public dialogRef: MatDialogRef<RecipientDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private countryService: CountryService,
    private stateProvinceService: StateProvinceService,
    private sharedDataService: SharedDataService,
    private toaster: ToasterService,
  ) {
    countryService.getCountryLookup().subscribe(res => (this.countries = res.items));
    stateProvinceService.getStateProvinceLookup().subscribe(res => {
      this.stateProvinces = this.filteredStateProvinces = res.items;

      const selectedCountryId = sharedDataService.corporateSettings?.countryId;
      if (!this.data.countryId && selectedCountryId) {
        this.sharedDataService.bindCorporateSelectedCountry(this.form);
        this.filteredStateProvinces = this.stateProvinces.filter(
          item => item.countryId === selectedCountryId,
        );
      }
    });

    this.form = this.fb.group({
      firstName: [this.data.firstName || '', Validators.required],
      lastName: [this.data.lastName || '', Validators.required],
      locationType: [this.data.locationType || '', Validators.required],
      attention: [this.data.attention || ''],
      deliveryCodeId: [this.data.deliveryCodeId || null],
      address1: [this.data.address1 || '', Validators.required],
      address2: [this.data.address2 || ''],
      city: [this.data.city || '', Validators.required],
      zipCode: [this.data.zipCode || '', Validators.required],
      stateProvinceId: [this.data.stateProvinceId || '', Validators.required],
      countryId: [this.data.countryId || '', Validators.required],
      email: [this.data.email || '', [Validators.email]],
      phoneType: [this.data.phoneType || null],
      number: [this.data.number || '', Validators.required],
      shortCode: [this.data.shortCode || ''],
    });
  }

  onChangeCountry(event: any) {
    if (event) {
      if (!event.value) {
        return;
      }

      this.filteredStateProvinces = this.stateProvinces.filter(
        item => item.countryId === event.value,
      );
    } else {
      this.form.patchValue({
        stateProvinceId: null,
      });
      this.filteredStateProvinces = [];
    }
  }

  onSave(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    } else {
      this.form.markAllAsTouched();
      this.toaster.error('::ValidationError:InvalidFormOrData');
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
