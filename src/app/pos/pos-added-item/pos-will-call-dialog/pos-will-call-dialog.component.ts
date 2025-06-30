import { Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import {
  DeliveryType,
  deliveryTypeOptions,
  DeliveryZoneDto,
  DeliveryZoneService,
} from '@proxy/deliveries';
import { MessageShortCutDto, MessageShortCutService } from '@proxy/message-short-cuts';
import {
  CreateUpdateShippingDetailsDto,
  DeliveryCategory,
  deliveryTimeTypeOptions,
  SubOrderService,
} from '@proxy/orders';
import { numberTypeOptions } from '@proxy/phone-directories';
import {
  CreateUpdateRecipientDeliveryDetailDto,
  CreateUpdateRecipientPersonalizationDto,
  locationTypeOptions,
  RecipientPersonalizationDto,
} from '@proxy/recipients';
import { StoreLookupDto, StoreService } from '@proxy/stores';
import { occasionCodeOptions } from '@proxy/recipients';
import { CountryService } from '@proxy/countries';
import { StateProvinceService } from '@proxy/state-provinces';
import { sortEnumValues } from 'src/app/shared/common-utils';

@Component({
  selector: 'app-pos-will-call-dialog',
  templateUrl: './pos-will-call-dialog.component.html',
  styleUrl: './pos-will-call-dialog.component.scss',
})
export class PosWillCallDialogComponent implements OnInit {
  deliveryAddressForm: FormGroup;
  deliveryDetailsForm: FormGroup;
  orderPersonalizationForm: FormGroup;
  isAddMode: boolean;
  productId: string;
  occasions = sortEnumValues(occasionCodeOptions);
  recipientPersonalizationFormArray: FormArray;
  maxRecipients: number;
  locationTypes = sortEnumValues(locationTypeOptions);
  numberTypes = sortEnumValues(numberTypeOptions);
  deliveryTypes = sortEnumValues(deliveryTypeOptions);
  availableStores: StoreLookupDto[];
  availableZones: DeliveryZoneDto[];
  shortCodes: MessageShortCutDto[] = [];
  selectedPickupStoreAddress: string = '';
  deliveryTimings = sortEnumValues(deliveryTimeTypeOptions);
  countryName: string = '';
  stateName: string = '';
  readonly deliveryTypeEnum = DeliveryType;

  constructor(
    private readonly fb: FormBuilder,
    public dialogRef: MatDialogRef<PosWillCallDialogComponent>,
    private readonly deliveryZoneService: DeliveryZoneService,
    private readonly messageShortCutService: MessageShortCutService,
    private readonly storeService: StoreService,
    private readonly countryService: CountryService,
    private readonly stateService: StateProvinceService,
    private subOrderService: SubOrderService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.isAddMode = !data?.recipient;
    this.maxRecipients = data?.subOrderItem.qty;
    this.messageShortCutService.getAllList().subscribe(res => (this.shortCodes = res.items));
  }

  ngOnInit(): void {
    this.buildForm();
    this.getAllZones();
    this.getAvailableStores();

    this.deliveryDetailsForm.get('isPickedUp').valueChanges.subscribe((checked: boolean) => {
      const expressFeeControl = this.deliveryDetailsForm.get('pickedUpBy');
      if (checked) {
        expressFeeControl.enable();
      } else {
        expressFeeControl.disable();
        expressFeeControl.reset();
      }
    });

    if (!this.deliveryDetailsForm.get('isPickedUp').value) {
      this.deliveryDetailsForm.get('pickedUpBy').disable();
    }

    this.deliveryDetailsForm.get('isTimeRequired').valueChanges.subscribe((isChecked: boolean) => {
      this.updateFieldBasedOnTimeRequirement(isChecked);
    });

    if (this.deliveryDetailsForm.get('pickupLocationId').value) {
      this.loadStoreDetails(this.deliveryDetailsForm.get('pickupLocationId').value);
    }
  }

  buildForm() {
    this.deliveryDetailsForm = this.fb.group({
      deliveryFromDate: ['', Validators.required],
      deliveryToDate: ['', Validators.required],
      deliveryType: [{ value: DeliveryType.WillCall, disabled: true }, Validators.required],
      isTimeRequired: [false],
      deliveryTimeHour: [null, [Validators.min(0), Validators.max(23)]],
      defaultDeliveryMinute: [null, [Validators.min(0), Validators.max(59)]],
      deliveryTimeType: [null],
      pickupLocationId: [''],
      personPickingUp: [''],
      isPickedUp: [false],
      pickedUpBy: [''],
      specialInstruction: ['', Validators.maxLength(75)],
      deliveryFee: [{ value: 0, disabled: true }, Validators.required],
    });

    if (this.data.personalizations.length === 0) {
      this.recipientPersonalizationFormArray = this.fb.array([
        this.createRecipientPersonalizationForm(),
      ]);
    } else {
      this.recipientPersonalizationFormArray = this.fb.array(
        this.data.personalizations.map((personalization: RecipientPersonalizationDto) => {
          return this.fb.group({
            id: [null],
            recipientName: [''],
            shortCodeId: [''],
            cardMessage: [''],
          });
        }),
      );
    }

    this.orderPersonalizationForm = this.fb.group({
      occasion: [this.data?.subOrderItem?.occasionCode || ''],
      copyCardMessage: [this.data?.recipient?.recipientPersonalization?.copyCardMessage || false],
      recipientPersonalization: this.recipientPersonalizationFormArray,
    });

    this.deliveryDetailsForm.patchValue(this.data?.deliveryDetails);
    this.recipientPersonalizationFormArray.patchValue(this.data?.personalizations);
  }

  updateFieldBasedOnTimeRequirement(isChecked: boolean): void {
    const deliveryTimingControl = this.deliveryDetailsForm.get('deliveryTimeType');
    deliveryTimingControl.clearValidators();
    if (isChecked) {
      deliveryTimingControl.setValidators([Validators.required]);
    }
    deliveryTimingControl.updateValueAndValidity({ emitEvent: false });
  }

  getAllZones() {
    this.deliveryZoneService.getDeliveryZoneList().subscribe(response => {
      this.availableZones = response;
    });
  }

  getAvailableStores() {
    this.storeService.getStoreLookup().subscribe(response => {
      this.availableStores = response.items;
    });
  }

  createRecipientPersonalizationForm(): FormGroup {
    return this.fb.group({
      recipientName: [''],
      shortCodeId: [''],
      cardMessage: [''],
    });
  }

  addRecipientForm(): void {
    if (this.recipientPersonalizationFormArray.length < this.maxRecipients) {
      this.recipientPersonalizationFormArray.push(this.createRecipientPersonalizationForm());
    }
  }

  removeRecipientForm(index: number): void {
    if (this.recipientPersonalizationFormArray.length > 1) {
      this.recipientPersonalizationFormArray.removeAt(index);
    }
  }

  onShortCodeChange(selectedCodeId: string, index: number) {
    if (selectedCodeId) {
      const shortCode = this.shortCodes.find(x => x.id === selectedCodeId);
      this.recipientPersonalizationFormArray
        .at(index)
        .get('cardMessage')
        ?.setValue(shortCode.description);
    }
  }

  onChangePickupLocation(event: MatSelectChange) {
    const selectedStoreId = event.value;
    this.loadStoreDetails(selectedStoreId);
  }

  loadStoreDetails(selectedStoreId: string) {
    this.storeService.get(selectedStoreId).subscribe(response => {
      if (response) {
        this.countryService.get(response.countryId).subscribe(country => {
          this.countryName = country.name;

          this.stateService.get(response.provinceId).subscribe(state => {
            this.stateName = state.name;
            this.selectedPickupStoreAddress = response.addressLine1
              ? `${response.addressLine1}, ${this.countryName}, ${response.city}, ${this.stateName}, ${response.zipCode}`
              : '';
          });
        });
      }
    });
  }

  onSave(): void {
    if (this.deliveryDetailsForm.valid && this.orderPersonalizationForm.valid) {
      this.setSubOrderDeliveryDetails();
    }
  }

  setSubOrderDeliveryDetails() {
    let createRecipientDeliveryDetailDto: CreateUpdateRecipientDeliveryDetailDto = {
      ...this.deliveryDetailsForm.getRawValue(),
    };

    let createRecipientPersonalizationDtos: CreateUpdateRecipientPersonalizationDto[] = [];
    this.recipientPersonalizationFormArray.value.forEach(element => {
      createRecipientPersonalizationDtos.push({
        ...element,
        subOrderId: this.data?.subOrderItem?.id,
      });
    });

    let createUpdateShippingDetailsDto: CreateUpdateShippingDetailsDto = {
      deliveryCategory: DeliveryCategory.WillCall,
      createUpdateRecipientDto: undefined,
      createUpdateRecipientDeliveryDetailDto: createRecipientDeliveryDetailDto,
      createUpdateRecipientPersonalizationDtos: createRecipientPersonalizationDtos,
    };

    this.subOrderService
      .setShippingDetailsBySubOrderIdAndCreateUpdateShippingDetailsDto(
        this.data?.subOrderItem?.id,
        createUpdateShippingDetailsDto,
      )
      .subscribe(x => {
        this.dialogRef.close({
          recipientPersonalizationDtos: x.recipientPersonalizationDtos,
          occasion: this.orderPersonalizationForm.value.occasion,
        });
      });
  }

  duplicateRecipientForm(index: number): void {
    if (this.recipientPersonalizationFormArray.length >= this.maxRecipients) return;

    const sourceGroup = this.recipientPersonalizationFormArray.at(index);
    const newGroup = this.createRecipientPersonalizationForm();
    newGroup.patchValue(sourceGroup.value);

    this.recipientPersonalizationFormArray.insert(index + 1, newGroup);
  }
}
