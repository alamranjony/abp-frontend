import {
  Component,
  effect,
  Inject,
  OnDestroy,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CountryLookupDto, CountryService } from '@proxy/countries';
import {
  DeliveryFeeType,
  deliveryFeeTypeOptions,
  DeliveryShortCodeDto,
  DeliveryShortCodeService,
  DeliveryType,
  deliveryTypeOptions,
  DeliveryZoneCoordinateDto,
  DeliveryZoneCoordinateService,
  DeliveryZoneDto,
  DeliveryZoneService,
} from '@proxy/deliveries';
import {
  CreateUpdateRecipientDeliveryDetailDto,
  CreateUpdateRecipientDto,
  CreateUpdateRecipientPersonalizationDto,
  locationTypeOptions,
  occasionCodeOptions,
  RecipientDeliveryDetailDto,
  RecipientDto,
  RecipientPersonalizationDto,
  RecipientService,
} from '@proxy/recipients';
import { numberTypeOptions } from '@proxy/phone-directories';
import { StateProvinceLookupDto, StateProvinceService } from '@proxy/state-provinces';
import { StoreLookupDto, StoreService } from '@proxy/stores';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { AddressSuggestionDialogComponent } from './address-suggestion-dialog/address-suggestion-dialog.component';
import { forkJoin, lastValueFrom, Subject, takeUntil } from 'rxjs';
import { MessageShortCutDto, MessageShortCutService } from '@proxy/message-short-cuts';
import { generateTomTomGeocodeUrl } from 'src/app/shared/map-utils';
import { SharedDataService } from '../../shared-data.service';
import { OrderSummary } from '../../models/order-summary.model';
import { MatSelectChange } from '@angular/material/select';
import { DeliveryChargeService } from '../../../services/delivery-charge.service';
import {
  CreateUpdateShippingDetailsDto,
  DeliveryCategory,
  DeliveryTimeType,
  deliveryTimeTypeOptions,
  OrderType,
  ShippingDetailsDto,
  SubOrderService,
} from '@proxy/orders';
import { TomTomApiKeySettingsService } from '@proxy/tom-tom';
import { ToasterService } from '@abp/ng.theme.shared';
import { WireService, wireServiceOptions } from '@proxy/common';
import {
  CreateUpdateWireServiceOrderAdditionalDataDto,
  WireServiceAllocationService,
  WireServiceOrderAdditionalDataDto,
  WireServiceOrderAdditionalDataService,
} from '@proxy/wire-services';
import { ShopDto } from '@proxy/shops';
import { ShopSelectionDialogComponent } from './shop-selection-dialog/shop-selection-dialog.component';
import { WireServiceOrderStatus } from '@proxy/wire-services/common';
import { sortEnumValues } from 'src/app/shared/common-utils';

@Component({
  selector: 'app-pos-recipient-details-dialog',
  templateUrl: './pos-add-recipient-details-dialog.component.html',
  styleUrl: './pos-add-recipient-details-dialog.component.scss',
})
export class PosAddRecipientDetailsDialogComponent implements OnInit, OnDestroy {
  deliveryAddressForm: FormGroup;
  deliveryDetailsForm: FormGroup;
  orderPersonalizationForm: FormGroup;
  isAddMode: boolean;
  productId: string;
  productIds: string[] = [];
  productName: string;
  productCode: string;
  recipientName: string;
  occasions = sortEnumValues(occasionCodeOptions);
  shortCodes: MessageShortCutDto[] = [];
  addressShortCodes: DeliveryShortCodeDto[] = [];
  recipientPersonalizationFormArray: FormArray;
  maxRecipients: number;
  countries: CountryLookupDto[];
  stateProvinces: StateProvinceLookupDto[];
  filteredStateProvinces: StateProvinceLookupDto[];
  wireServices = wireServiceOptions;
  locationTypes = sortEnumValues(locationTypeOptions);
  numberTypes = sortEnumValues(numberTypeOptions);
  deliveryTypes = sortEnumValues(deliveryTypeOptions);
  deliveryTimings = sortEnumValues(deliveryTimeTypeOptions);
  deliveryFeeTypes = sortEnumValues(deliveryFeeTypeOptions);
  availableStores: StoreLookupDto[];
  availableZones: DeliveryZoneDto[];
  tomtomApiKey: string;
  isAddressValid = false;
  wireOutFee: number = 100;
  orderSummary: OrderSummary;
  private deliveryZoneId: string;
  public DeliveryType = DeliveryType;
  public orderType = OrderType;
  public DeliveryFeeType = DeliveryFeeType;
  private deliveryFee: WritableSignal<number> = signal(0);
  private deliveryFromDate: Date = undefined;
  private deliveryToDate: Date = undefined;
  private deliveryTime: { hour: number; minute: number } = { hour: undefined, minute: undefined };
  private deliveryTimeType: DeliveryTimeType = undefined;
  private deliveryFeeType: DeliveryFeeType = undefined;
  private isTimeRequired: boolean = false;
  private destroy$: Subject<void> = new Subject();
  private wireServiceAdditionalData?: WireServiceOrderAdditionalDataDto = undefined;
  private selectedDeliveryType?: DeliveryType = undefined;

  defaultDeliveryHour: number = 12;
  defaultDeliveryMinute: number = 30;
  zoneSaleTax: number;
  recipient: RecipientDto;
  deliveryDetails: RecipientDeliveryDetailDto;
  isShippingDetailsLoaded: boolean = false;
  productCodes: string[] = [];

  readonly deliveryTypesToRemove: DeliveryType[] = [
    DeliveryType.CarryOut,
    DeliveryType.WillCall,
    DeliveryType.PhoneOut,
    DeliveryType.Pickup,
    DeliveryType.Redelivery,
    DeliveryType.Replacement,
  ];

  visibleDeliveryTypes = this.deliveryTypes.filter(
    d => !this.deliveryTypesToRemove.includes(d.value),
  );

  constructor(
    private readonly fb: FormBuilder,
    public dialogRef: MatDialogRef<PosAddRecipientDetailsDialogComponent>,
    private readonly countryService: CountryService,
    private readonly stateProvinceService: StateProvinceService,
    private readonly storeService: StoreService,
    private readonly deliveryZoneService: DeliveryZoneService,
    private readonly recipientService: RecipientService,
    private readonly http: HttpClient,
    private readonly handler: HttpBackend,
    private readonly dialog: MatDialog,
    private readonly deliveryZoneCoordinateService: DeliveryZoneCoordinateService,
    private readonly messageShortCutService: MessageShortCutService,
    private readonly sharedDataService: SharedDataService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly deliveryChargeService: DeliveryChargeService,
    private readonly deliveryShortCodeService: DeliveryShortCodeService,
    private readonly subOrderService: SubOrderService,
    private readonly tomTomApiKeyService: TomTomApiKeySettingsService,
    private readonly toasterService: ToasterService,
    private readonly wireServiceAllocationService: WireServiceAllocationService,
    private readonly wireServiceAdditionalDataService: WireServiceOrderAdditionalDataService,
  ) {
    this.isAddMode = !data?.recipient;
    this.productId = data?.subOrderItem?.productItem?.productId;
    this.productName = data?.subOrderItem?.productItem?.productName;
    this.productCode = data?.subOrderItem?.productItem?.productCode;
    this.recipientName = data?.recipient?.firstName.concat(' ', data?.recipient?.lastName);
    this.maxRecipients = data?.quantity;
    this.productIds = data?.products;
    this.tomTomApiKeyService.getTomTomApiKey().subscribe(setting => {
      this.tomtomApiKey = setting.apiKey;
    });
    this.messageShortCutService.getAllList().subscribe(res => (this.shortCodes = res.items));
    this.http = new HttpClient(this.handler);

    this.recipient = this.data.recipient;
    this.deliveryDetails = this.data.deliveryDetails;
    this.isShippingDetailsLoaded = this.data.isShippingDetailsLoaded;
    this.productCodes = data?.productCodes;

    effect(() => {
      this.deliveryDetailsForm
        .get('deliveryFee')
        ?.setValue(this.deliveryFee()?.toFixed(2), { emitEvent: true });
    });
  }

  ngOnInit(): void {
    this.countryService.getCountryLookup().subscribe(res => (this.countries = res.items));
    this.stateProvinceService.getStateProvinceLookup().subscribe(res => {
      this.stateProvinces = this.filteredStateProvinces = res.items;

      const selectedCountryId = this.sharedDataService.corporateSettings?.countryId;
      if (this.isAddMode && selectedCountryId) {
        this.sharedDataService.bindCorporateSelectedCountry(this.deliveryAddressForm);
        this.filteredStateProvinces = this.stateProvinces.filter(
          item => item.countryId === selectedCountryId,
        );
      }
    });
    this.buildForm();
    this.getAvailableStores();
    this.getAllZones();

    this.deliveryDetailsForm
      .get('deliveryType')
      .valueChanges.subscribe((deliveryType: DeliveryType) => {
        this.selectedDeliveryType = deliveryType;
      });

    this.updateFieldsBasedOnDeliveryType(this.selectedDeliveryType);

    if (!this.isAddMode) {
      forkJoin([
        this.countryService.getCountryLookup(),
        this.stateProvinceService.getStateProvinceLookup(),
      ]).subscribe(([countriesRes, stateProvincesRes]) => {
        this.countries = countriesRes.items;
        this.stateProvinces = this.filteredStateProvinces = stateProvincesRes.items;
        this.checkInitialAddressValidity();
      });
    }

    this.sharedDataService.orderSummary.subscribe(x => {
      this.orderSummary = x;
      if (this.orderSummary?.orderType === OrderType.PHO) {
        this.deliveryDetailsForm.get('deliveryType')?.setValue(DeliveryType.PhoneOut);
      }
    });

    this.deliveryDetailsForm.get('isTimeRequired').valueChanges.subscribe((isChecked: boolean) => {
      this.updateFieldBasedOnTimeRequirement(isChecked);
      this.isTimeRequired = isChecked;
    });

    this.deliveryShortCodeService.getAllList().subscribe(res => {
      this.addressShortCodes = res.items;
      this.deliveryAddressForm.patchValue({
        addressShortCode: this.data.recipient.addressShortCode,
      });
    });

    this.deliveryZoneId = this.data.deliveryDetails.deliveryZoneId;
    this.deliveryFee.set(this.deliveryDetails.deliveryFee || 0);

    if (this.data?.isEditMode) {
      this.wireServiceAdditionalDataService
        .getWireServiceAdditionalDataBySubOrderId(this.data?.subOrderItem?.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe((res: WireServiceOrderAdditionalDataDto) => {
          if (!res) return;
          this.wireServiceAdditionalData = res;
          this.deliveryDetailsForm.patchValue({
            wireServiceShopId: res.receiverShopId,
            wireServiceShopCode: res.receiverShopDto.shopCode,
          });
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  checkInitialAddressValidity(): void {
    this.validateAddress().then(isValid => {
      this.isAddressValid = isValid;
    });
  }

  buildForm() {
    this.deliveryAddressForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      address1: ['', Validators.required],
      address2: [''],
      locationType: ['', Validators.required],
      countryId: ['', Validators.required],
      stateProvinceId: ['', Validators.required],
      city: ['', Validators.required],
      zipCode: ['', Validators.required],
      attention: [''],
      email: ['', Validators.email],
      phoneNumber: [''],
      numberType: [null],
      addressShortCode: [''],
      latitude: [null],
      longitude: [null],
    });

    this.deliveryDetailsForm = this.fb.group({
      id: [null],
      deliveryFromDate: ['', Validators.required],
      deliveryToDate: ['', Validators.required],
      deliveryFeeType: [0],
      deliveryType: [this.data?.recipient?.deliveryType ?? 0, Validators.required],
      deliveryZoneId: [0, Validators.required],
      fulfillingStoreId: ['', Validators.required],
      isTimeRequired: [false],
      deliveryTimeHour: [this.defaultDeliveryHour, [Validators.min(0), Validators.max(23)]],
      deliveryTimeMinute: [this.defaultDeliveryMinute, [Validators.min(0), Validators.max(59)]],
      deliveryTimeType: [null],
      specialInstruction: ['', Validators.maxLength(75)],
      deliveryFee: [0, Validators.required],
      wireServiceId: [0, Validators.required],
      headquarterCode: [''],
      relayFee: [0],
      wireServiceShopId: [null],
      wireServiceShopCode: [null],
    });

    this.toggleDeliveryType();

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

    this.deliveryDetailsForm.get('deliveryFromDate').valueChanges.subscribe(value => {
      this.deliveryFromDate = new Date(value);
      this.toggleDeliveryType();
    });
    this.deliveryDetailsForm.get('deliveryToDate').valueChanges.subscribe(value => {
      this.deliveryToDate = new Date(value);
      this.toggleDeliveryType();
    });
    this.deliveryDetailsForm.get('deliveryFeeType').valueChanges.subscribe(value => {
      this.deliveryFeeType = value;
    });
    this.deliveryDetailsForm.get('deliveryTimeHour').valueChanges.subscribe(value => {
      this.deliveryTime = {
        ...this.deliveryTime,
        hour: value,
      };
    });
    this.deliveryDetailsForm.get('deliveryTimeMinute').valueChanges.subscribe(value => {
      this.deliveryTime = {
        ...this.deliveryTime,
        minute: value,
      };
    });
    this.deliveryDetailsForm.get('deliveryTimeType').valueChanges.subscribe(value => {
      this.deliveryTimeType = value;
    });

    this.deliveryAddressForm.patchValue(this.data.recipient);
    this.deliveryDetailsForm.patchValue(this.data.deliveryDetails);
    this.recipientPersonalizationFormArray.patchValue(this.data.personalizations);
  }

  updateFieldsBasedOnDeliveryType(type: DeliveryType): void {
    const fulfillingStoreControl = this.deliveryDetailsForm.get('fulfillingStoreId');
    const wireServiceControl = this.deliveryDetailsForm.get('wireServiceId');
    const headquarterCodeControl = this.deliveryDetailsForm.get('headquarterCode');
    const deliveryZoneControl = this.deliveryDetailsForm.get('deliveryZoneId');
    const wireServiceShopControl = this.deliveryDetailsForm.get('wireServiceShopId');

    // Clear all previous validators
    fulfillingStoreControl.clearValidators();
    deliveryZoneControl.clearValidators();
    wireServiceControl.clearValidators();
    headquarterCodeControl.clearValidators();

    if (type === DeliveryType.Delivery) {
      fulfillingStoreControl.enable();
      deliveryZoneControl.enable();
      headquarterCodeControl.disable();
      if (this.orderSummary?.orderType !== OrderType.PHO) wireServiceControl.disable();

      fulfillingStoreControl.setValidators([Validators.required]);
      deliveryZoneControl.setValidators([Validators.required]);
    } else if (type === DeliveryType.Fringe) {
      fulfillingStoreControl.disable();
      headquarterCodeControl.disable();
      if (this.orderSummary?.orderType !== OrderType.PHO) wireServiceControl.disable();

      deliveryZoneControl.setValidators([Validators.required]);
      fulfillingStoreControl.clearValidators();
    } else if (type === DeliveryType.Overseas || type === DeliveryType.WireOut) {
      fulfillingStoreControl.disable();
      deliveryZoneControl.disable();
      wireServiceControl.enable();
      headquarterCodeControl.enable();

      fulfillingStoreControl.clearValidators();
      deliveryZoneControl.clearValidators();
      wireServiceControl.setValidators([Validators.required]);
    }

    fulfillingStoreControl.updateValueAndValidity({ emitEvent: false });
    deliveryZoneControl.updateValueAndValidity({ emitEvent: false });
    wireServiceControl.updateValueAndValidity({ emitEvent: false });
    headquarterCodeControl.updateValueAndValidity({ emitEvent: false });
    wireServiceShopControl.updateValueAndValidity({ emitEvent: false });
  }

  updateFieldBasedOnTimeRequirement(isChecked: boolean): void {
    const deliveryTimingControl = this.deliveryDetailsForm.get('deliveryTimeType');
    deliveryTimingControl.clearValidators();
    if (isChecked) {
      deliveryTimingControl.setValidators([Validators.required]);
    }
    deliveryTimingControl.updateValueAndValidity({ emitEvent: false });
  }

  getAvailableStores() {
    this.storeService.getStoreLookup().subscribe(response => {
      this.availableStores = response.items;
    });
  }

  getAllZones() {
    this.deliveryZoneService.getDeliveryZoneList().subscribe(async response => {
      this.availableZones = response;
      this.availableZones.find(e => e.id === this.deliveryZoneId);
      if (this.deliveryZoneId) {
        await this.onChangeDeliveryZone({ value: this.deliveryZoneId, source: {} as any });
      }
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
      this.deliveryAddressForm.patchValue({
        stateProvinceId: null,
      });
      this.filteredStateProvinces = [];
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

  onChangeAddressShortCode(event: MatSelectChange) {
    const shortCodeId = event?.value;
    const selectedShortCode = this.addressShortCodes.find(item => item.id === shortCodeId);
    this.deliveryChargeService.adjustByDeliveryShortCode(selectedShortCode);
    this.deliveryFee.set(this.deliveryChargeService.getDeliveryCharge);

    if (!shortCodeId) {
      return;
    }

    if (selectedShortCode) {
      this.deliveryAddressForm.patchValue({
        address1: selectedShortCode.address1 || '',
        address2: selectedShortCode.address2 || '',
        countryId: selectedShortCode.countryId || '',
        stateProvinceId: selectedShortCode.stateProvinceId || '',
        city: selectedShortCode.city || '',
        zipCode: selectedShortCode.zipCode || '',
        phoneNumber: selectedShortCode.phoneNumber || '',
      });
      this.deliveryDetailsForm.patchValue({
        deliveryZoneId: selectedShortCode.zoneId || '',
        deliveryType: selectedShortCode.deliveryType || '',
        fulfillingStoreId: selectedShortCode.storeId || '',
        specialInstruction: selectedShortCode.specialInstruction || '',
      });
    }
  }

  createRecipientPersonalizationForm(): FormGroup {
    return this.fb.group({
      id: [null],
      recipientName: [this.recipientName || ''],
      shortCodeId: [''],
      cardMessage: [''],
    });
  }

  onChangeDeliveryType(event: MatSelectChange) {
    const deliveryType = event.value as DeliveryType;
    this.updateFieldsBasedOnDeliveryType(deliveryType);

    if (deliveryType === DeliveryType.WireOut) {
      this.selectWireServiceAndShop();
    }
  }

  async onChangeDeliveryZone(event: MatSelectChange) {
    if (event.value) {
      this.deliveryZoneId = event.value;
      const selectedDeliveryZone = this.availableZones.find(x => x.id === event.value);
      await this.deliveryChargeService.adjustByDeliveryZone(
        selectedDeliveryZone,
        this.deliveryFeeType,
        this.deliveryFromDate,
        this.deliveryToDate,
        this.isTimeRequired ? this.deliveryTime : null,
        this.deliveryTimeType,
      );
      this.deliveryFee.set(this.deliveryChargeService.getDeliveryCharge);
      this.deliveryDetailsForm.patchValue({ deliveryFeeType: 0 });

      this.deliveryZoneService.get(this.deliveryZoneId).subscribe((x: DeliveryZoneDto) => {
        this.zoneSaleTax = x.salesTax;
      });
    }
  }

  async onChangeDeliveryDetailsInfo() {
    const selectedDeliveryZone = this.availableZones.find(e => e.id === this.deliveryZoneId);
    if (!selectedDeliveryZone) return;

    const feeTypeControl = this.deliveryDetailsForm.get('deliveryFeeType');
    const includesSunday = this.hasSundayBetweenDates(this.deliveryFromDate, this.deliveryToDate);

    const feeTypeToUse = includesSunday
      ? DeliveryFeeType.Sunday
      : this.deliveryFeeType === DeliveryFeeType.Sunday
        ? null
        : this.deliveryFeeType;
    feeTypeControl.setValue(feeTypeToUse);
    await this.adjustFeeAndSet(feeTypeToUse, selectedDeliveryZone);
  }

  private async adjustFeeAndSet(type: DeliveryFeeType, zone: DeliveryZoneDto) {
    await this.deliveryChargeService.adjustByDeliveryZone(
      zone,
      type,
      this.deliveryFromDate,
      this.deliveryToDate,
      this.isTimeRequired ? this.deliveryTime : null,
      this.deliveryTimeType,
    );
    this.deliveryFee.set(this.deliveryChargeService.getDeliveryCharge);
  }

  async onChangeDeliveryFeeType(event: MatSelectChange) {
    const selectedDeliveryFeeTypeEnum = Number(event.value) as DeliveryFeeType;
    const selectedZoneId = this.deliveryDetailsForm.get('deliveryZoneId')?.value;

    if (!selectedZoneId) {
      return;
    }

    const selectedZone = this.availableZones.find(zone => zone.id === selectedZoneId);
    if (!selectedZone) {
      return;
    }

    await this.deliveryChargeService.adjustByDeliveryZone(
      selectedZone,
      selectedDeliveryFeeTypeEnum,
      this.deliveryFromDate,
      this.deliveryToDate,
      this.isTimeRequired ? this.deliveryTime : null,
      this.deliveryTimeType,
    );
    this.deliveryFee.set(this.deliveryChargeService.getDeliveryCharge);
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

  isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
    let inside = false;
    const [x, y] = point;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];

      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  async validateAddress(): Promise<boolean> {
    const address = this.deliveryAddressForm.value;
    const countryName = this.getCountryNameById(address.countryId);
    const stateName = this.getStateNameById(address.stateProvinceId);
    const query = `${address.address1}, ${address.city}, ${stateName}, ${countryName}, ${address.zipCode}`;
    const url = generateTomTomGeocodeUrl(query, this.tomtomApiKey);

    try {
      const response: any = await lastValueFrom(this.http.get(url));

      if (response.results && response.results.length > 0) {
        const result = response.results[0].address;
        const position = response.results[0].position;
        const point: [number, number] = [position.lat, position.lon];

        for (const zone of this.availableZones) {
          const coordinates = await this.deliveryZoneCoordinateService
            .getCoordinatesByDeliveryZone(zone.id)
            .toPromise()
            .then((coordinateDtos: DeliveryZoneCoordinateDto[]) =>
              coordinateDtos.map(dto => [dto.latitude, dto.longitude] as [number, number]),
            );

          const isInsideArea = this.isPointInPolygon(point, coordinates);
          if (isInsideArea) {
            this.deliveryFee.set(zone.deliveryFee);
            this.deliveryDetailsForm.get('deliveryZoneId').setValue(zone.id);
            return true;
          } else {
            if (address.zipCode == zone.zipCode) {
              this.deliveryFee.set(zone.deliveryFee);
              this.deliveryDetailsForm.get('deliveryZoneId').setValue(zone.id);
              return true;
            }
          }
        }
        this.deliveryAddressForm.get('latitude').setValue(point[0].toString());
        this.deliveryAddressForm.get('longitude').setValue(point[1].toString());
        // Validate the address format if no zone matches
        if (await this.isValidAddress(result, address)) {
          this.toasterService.success('::AddressValidationSuccess');
          return true;
        } else {
          this.toasterService.error('::AddressValidationFailed');
          this.showRelevantSuggestions(response.results);
          return false;
        }
      } else {
        this.toasterService.error('::InvalidAddress');
        this.suggestGeneralAddresses(address);
        return false;
      }
    } catch (error) {
      this.toasterService.error('::AddressValidationFailedTryAgain');
      return false;
    }
  }

  showMapDialog(suggestions: any[]) {
    const dialogRef = this.dialog.open(AddressSuggestionDialogComponent, {
      width: '800px',
      data: { suggestions },
    });

    dialogRef.afterClosed().subscribe(selectedAddress => {
      if (selectedAddress) {
        this.deliveryAddressForm.patchValue(selectedAddress);
        this.checkInitialAddressValidity();
      } else {
        this.isAddressValid = true;
        this.deliveryFee.set(this.wireOutFee);
      }
    });
  }

  showRelevantSuggestions(results: any[]) {
    this.showMapDialog(results);
  }

  suggestGeneralAddresses(address: any) {
    const generalizedQuery = `${address.city || ''}, ${this.getStateNameById(address.stateProvinceId) || ''}, ${this.getCountryNameById(address.countryId) || ''}`;
    const generalUrl = generateTomTomGeocodeUrl(generalizedQuery, this.tomtomApiKey);
    this.http.get(generalUrl).subscribe(
      (response: any) => {
        if (response.results && response.results.length > 0) {
          const validResults = response.results.filter((result: any) => {
            const hasCity = !!result.address.municipality;
            const hasZipCode = !!result.address.postalCode;
            return hasCity && hasZipCode;
          });

          if (validResults.length > 0) {
            this.showRelevantSuggestions(validResults);
          } else {
            this.toasterService.error('::AddressInvalidCheckInput');
          }
        } else {
          this.toasterService.error('::NoValidAddressFoundTryAgain');
        }
      },
      () => {
        this.toasterService.warn('::FailedToFetchAddressSuggestion');
      },
    );
  }

  async isValidAddress(result: any, address: any): Promise<boolean> {
    try {
      const country = await lastValueFrom(this.countryService.get(address.countryId));
      const twoLetterIsoCode = country.twoLetterIsoCode;
      const address1 = address.address1.toLowerCase();

      const validCountry = result.countryCode === twoLetterIsoCode;
      const validState =
        result.countrySubdivisionName === this.getStateNameById(address.stateProvinceId);
      const fullStreetAddress =
        (result.streetNumber ? result.streetNumber + ' ' : '') + result.streetName;
      const validAddress1 = this.compareStrings(fullStreetAddress.toLowerCase(), address1);

      return (
        validCountry &&
        validState &&
        validAddress1 &&
        this.compareStrings(result.municipality.toLowerCase(), address.city.toLowerCase()) &&
        (!result.postalCode || this.compareStrings(result.postalCode, address.zipCode))
      );
    } catch (error) {
      console.error('Error fetching country data:', error);
      return false;
    }
  }

  getCountryNameById(countryId: string): string | null {
    const country = this.countries.find(c => c.id === countryId);
    return country?.name;
  }

  getStateNameById(stateId: string): string | null {
    const state = this.filteredStateProvinces.find(s => s.id === stateId);
    return state?.name;
  }

  mapCountryNameToId(countryName: string): string | null {
    const country = this.countries.find(c => c.name.toLowerCase() === countryName.toLowerCase());
    return country?.id;
  }

  mapStateNameToId(stateName: string): string | null {
    const state = this.filteredStateProvinces.find(
      s => s.name.toLowerCase() === stateName.toLowerCase(),
    );
    return state?.id;
  }

  compareStrings(apiValue: string, formValue: string): boolean {
    return apiValue?.toLowerCase() === formValue?.toLowerCase();
  }

  onSave(): void {
    if (
      !this.deliveryAddressForm.valid ||
      !this.deliveryDetailsForm.valid ||
      !this.orderPersonalizationForm.valid
    ) {
      return;
    }

    const wireServiceIdControl = this.deliveryDetailsForm.get('wireServiceId').value;
    const wireServiceShopIdControl = this.deliveryDetailsForm.get('wireServiceShopId').value;

    if (
      this.orderSummary?.orderType === OrderType.PHO &&
      (wireServiceIdControl === 0 || !wireServiceShopIdControl)
    ) {
      if (wireServiceIdControl === 0) this.toasterService.error('::WireServiceType:Required');
      else if (!wireServiceShopIdControl) this.toasterService.error('::WireServiceShop:Required');
      return;
    }

    const deliveryType = this.deliveryDetailsForm.get('deliveryType').value;
    if (deliveryType === DeliveryType.WireOut) this.saveAdditionalDataForWireOutOrder();

    if (this.orderSummary?.orderType === OrderType.PHO) this.saveDataForPhoneOutOrder();

    setTimeout(() => {
      if (!this.data?.recipient) {
        this.createNewRecipientDetails();
      } else {
        this.setSubOrderDeliveryDetails();
      }
    }, 1000);
  }

  createNewRecipientDetails() {
    let createRecipientDeliveryDetailDto: CreateUpdateRecipientDeliveryDetailDto = {
      ...this.deliveryDetailsForm.value,
      deliveryFromDate: this.deliveryFromDate?.toLocaleDateString(),
      deliveryToDate: this.deliveryToDate?.toLocaleDateString(),
    };
    let recipientCreateDto: CreateUpdateRecipientDto = {
      ...this.deliveryAddressForm.value,
      customerId: this.orderSummary.customer?.id,
      createUpdateRecipientDeliveryDetailDto: createRecipientDeliveryDetailDto,
    };
    this.recipientService.create(recipientCreateDto).subscribe((x: RecipientDto) => {
      this.recipient = x;
      this.setSubOrderDeliveryDetails();
    });
  }

  setSubOrderDeliveryDetails() {
    const createRecipientDeliveryDetailDto: CreateUpdateRecipientDeliveryDetailDto = {
      ...this.deliveryDetailsForm.value,
      deliveryFromDate: this.deliveryFromDate?.toLocaleDateString(),
      deliveryToDate: this.deliveryToDate?.toLocaleDateString(),
    };

    const createRecipientPersonalizationDtos = this.recipientPersonalizationFormArray.value.map(
      (element: CreateUpdateRecipientPersonalizationDto) => ({
        ...element,
        subOrderId: this.data?.subOrderItem?.id,
      }),
    );

    const recipientCreateDto: CreateUpdateRecipientDto = {
      ...this.deliveryAddressForm.value,
      customerId: this.orderSummary.customer?.id,
    };

    const createUpdateShippingDetailsDtoTemplate: CreateUpdateShippingDetailsDto = {
      deliveryCategory: DeliveryCategory.Recipient,
      recipientId: this.recipient?.id,
      deliveryDetailsId: this.isShippingDetailsLoaded ? this.deliveryDetails?.id : undefined,
      createUpdateRecipientDto: recipientCreateDto,
      createUpdateRecipientDeliveryDetailDto: createRecipientDeliveryDetailDto,
      createUpdateRecipientPersonalizationDtos: createRecipientPersonalizationDtos,
    };

    if (this.data?.subOrderItems?.products?.length > 0) {
      const subOrderItemRequests = this.data.subOrderItems.products.map((subOrderItem: any) => {
        const shippingDetailsDto = {
          ...createUpdateShippingDetailsDtoTemplate,
          createUpdateRecipientPersonalizationDtos: createRecipientPersonalizationDtos.map(dto => ({
            ...dto,
            subOrderId: subOrderItem.id,
          })),
        };

        return this.subOrderService.setShippingDetailsBySubOrderIdAndCreateUpdateShippingDetailsDto(
          subOrderItem.id,
          shippingDetailsDto,
        );
      });

      forkJoin(subOrderItemRequests).subscribe((shippingDetailsDtos: ShippingDetailsDto[]) => {
        this.dialogRef.close({
          shippingDetailsDtos,
          zoneSaleTax: this.zoneSaleTax,
          deliveryFee: shippingDetailsDtos.reduce(
            (total, dto) => total + dto.deliveryDetailsDto.deliveryFee,
            0,
          ),
          occasion: this.orderPersonalizationForm.value.occasion,
        });
      });
    } else {
      const shippingDetailsDto = {
        ...createUpdateShippingDetailsDtoTemplate,
        createUpdateRecipientPersonalizationDtos: createRecipientPersonalizationDtos,
      };

      this.subOrderService
        .setShippingDetailsBySubOrderIdAndCreateUpdateShippingDetailsDto(
          this.data?.subOrderItem?.id,
          shippingDetailsDto,
        )
        .subscribe((shippingDetailsDto: ShippingDetailsDto) => {
          this.dialogRef.close({
            ...shippingDetailsDto,
            zoneSaleTax: this.zoneSaleTax,
            deliveryFee: shippingDetailsDto.deliveryDetailsDto.deliveryFee,
            occasion: this.orderPersonalizationForm.value.occasion,
          });
        });
    }
  }

  openShopListDialog() {
    const wireService = this.deliveryDetailsForm.get('wireServiceId');
    const deliveryFromDate = this.deliveryDetailsForm.get('deliveryFromDate');
    const deliveryToDate = this.deliveryDetailsForm.get('deliveryToDate');

    let hasError = false;

    if (!wireService?.value) {
      wireService?.markAsTouched();
      wireService?.markAsDirty();
      hasError = true;
    }

    if (!deliveryFromDate?.value) {
      deliveryFromDate?.markAsTouched();
      deliveryFromDate?.markAsDirty();
      hasError = true;
    }

    if (!deliveryToDate?.value) {
      deliveryToDate?.markAsTouched();
      deliveryToDate?.markAsDirty();
      hasError = true;
    }

    if (hasError) {
      return;
    }

    this.openShopSelectionDialog(wireService.value);
  }

  onChangeWireService(event: MatSelectChange) {
    this.deliveryDetailsForm.get('wireServiceShopCode').setValue(null);
    this.deliveryDetailsForm.get('wireServiceShopId').setValue(null);

    if (event.value) {
      this.openShopListDialog();
    }
  }

  private openShopSelectionDialog(wireService: WireService): void {
    const dialogRef = this.dialog.open(ShopSelectionDialogComponent, {
      height: '65%',
      width: '55%',
      data: { wireService },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((selectedShop: ShopDto) => {
        if (!selectedShop) return;

        this.deliveryDetailsForm.patchValue({
          wireServiceShopId: selectedShop.id,
          wireServiceShopCode: selectedShop.shopCode,
        });
      });
  }

  private toggleDeliveryType() {
    const fromDate = this.deliveryDetailsForm.get('deliveryFromDate').value;
    const toDate = this.deliveryDetailsForm.get('deliveryToDate').value;
    const controlsToToggle = [
      'deliveryType',
      'wireServiceId',
      'wireServiceShopId',
      'wireServiceShopCode',
      'deliveryZoneId',
      'fulfillingStoreId',
      'headquarterCode',
    ];
    if (fromDate && toDate) {
      controlsToToggle.forEach(control => this.deliveryDetailsForm.get(control)!.enable());
      if (!this.data?.isEditMode && this.selectedDeliveryType === DeliveryType.WireOut) {
        this.selectWireServiceAndShop();
      }
    } else {
      controlsToToggle.forEach(control => this.deliveryDetailsForm.get(control)!.disable());
    }
  }

  private selectWireServiceAndShop() {
    this.wireServiceAllocationService.getWireServiceForNextOrder(0, false).subscribe({
      next: (wireService: WireService) => {
        this.deliveryDetailsForm.patchValue({
          wireServiceId: wireService,
        });

        const zipCode = this.deliveryAddressForm.get('zipCode').value;
        this.wireServiceAllocationService
          .getFilteredShopDtoForWireOutOrder(
            wireService,
            zipCode,
            0,
            this.deliveryFromDate!.toLocaleDateString(),
            this.deliveryToDate!.toLocaleDateString(),
          )
          .pipe(takeUntil(this.destroy$))
          .subscribe((shop?: ShopDto) => {
            if (!shop) {
              this.toasterService.error('::WireService:SelectShopManually');
              this.openShopSelectionDialog(wireService);
            } else {
              this.deliveryDetailsForm.patchValue({
                wireServiceShopId: shop.id,
                wireServiceShopCode: shop.shopCode,
              });
            }
          });
      },
    });
  }

  private saveAdditionalDataForWireOutOrder() {
    const orderId = this.orderSummary.orderId;
    const subOrderId = this.data?.subOrderItem?.id;
    const subOrderIds = this.data?.subOrderItems?.products.map(e => e.id);
    const { wireServiceId, wireServiceShopId } = this.deliveryDetailsForm.value;
    const additionalDataDto: CreateUpdateWireServiceOrderAdditionalDataDto = {
      orderId: orderId,
      subOrderId: subOrderId,
      subOrderIds: subOrderIds,
      receiverShopId: wireServiceShopId,
      wireService: wireServiceId,
      wireServiceOrderStatus: WireServiceOrderStatus.Pending,
    };

    const request$ = this.wireServiceAdditionalData
      ? this.wireServiceAdditionalDataService.update(
          this.wireServiceAdditionalData.id,
          additionalDataDto,
        )
      : this.wireServiceAdditionalDataService.create(additionalDataDto);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {},
    });
  }

  private saveDataForPhoneOutOrder() {
    const subOrderId = this.data?.subOrderItem?.id;
    const { wireServiceId, wireServiceShopId } = this.deliveryDetailsForm.value;

    const request$ = this.subOrderService.updatePhoneOutOrderType(
      subOrderId,
      wireServiceId,
      wireServiceShopId,
    );
    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {},
    });
  }

  duplicateRecipientForm(index: number): void {
    if (this.recipientPersonalizationFormArray.length >= this.maxRecipients) return;

    const sourceGroup = this.recipientPersonalizationFormArray.at(index);
    const newGroup = this.createRecipientPersonalizationForm();
    newGroup.patchValue(sourceGroup.value);

    this.recipientPersonalizationFormArray.insert(index + 1, newGroup);
  }

  private hasSundayBetweenDates(start: Date, end: Date): boolean {
    const current = new Date(start);
    while (current <= end) {
      if (current.getDay() === 0) return true;
      current.setDate(current.getDate() + 1);
    }
    return false;
  }
}
