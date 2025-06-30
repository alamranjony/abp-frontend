import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  CreateUpdateDeliveryZoneDto,
  DeliveryZoneCoordinateDto,
  DeliveryZoneService,
  ZoneAreaSelector,
  zoneAreaSelectorOptions,
  zoneTypeOptions,
} from '@proxy/deliveries';
import { Router } from '@angular/router';
import { ToasterService } from '@abp/ng.theme.shared';
import { StoreLookupDto, StoreService } from '@proxy/stores';

@Component({
  selector: 'app-add-delivery-zone',
  templateUrl: './add-delivery-zone.component.html',
  styleUrl: './add-delivery-zone.component.scss',
})
export class AddDeliveryZoneComponent implements OnInit {
  form: FormGroup;
  zoneTypes = zoneTypeOptions;
  zoneAreaSelectors = zoneAreaSelectorOptions;
  readonly ZoneAreaSelector = ZoneAreaSelector;
  drawOnMapEnabled: boolean = false;
  zoneCoordinates: DeliveryZoneCoordinateDto[] = [];
  drawnCoordinates: DeliveryZoneCoordinateDto[] = [];
  availableStores: StoreLookupDto[];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private deliveryZoneService: DeliveryZoneService,
    private toaster: ToasterService,
    private storeService: StoreService,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.getAvailableStores();
  }

  buildForm() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [null],
      zoneType: [null, Validators.required],
      zipCode: [null],
      isAutoTransfer: [false],
      storeId: [null],
      deliveryFee: [0],
      within2HrDeliveryFee: [0],
      within3HrDeliveryFee: [0],
      within4HrDeliveryFee: [0],
      expressDeliveryFee: [0],
      sundayDeliveryFee: [0],
      weddingDayDeliveryFee: [0],
      futureDeliveryFee: [0],
      futureWithin2HrDeliveryFee: [0],
      futureWithin3HrDeliveryFee: [0],
      futureWithin4HrDeliveryFee: [0],
      salesTax: [0],
      zoneAreaSelector: [null, Validators.required],
      deliveryZoneCoordinates: this.fb.array([]),
    });
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }

    const { zoneAreaSelector, deliveryZoneCoordinates, ...rest } = this.form.value;
    const deliveryZoneDto: CreateUpdateDeliveryZoneDto = { ...rest };

    if (zoneAreaSelector === ZoneAreaSelector.ZipCode) deliveryZoneDto.coordinates = [];
    else if (zoneAreaSelector === ZoneAreaSelector.Coordinates) {
      deliveryZoneDto.zipCode = null;
      deliveryZoneDto.coordinates = this.zoneCoordinates;
    } else {
      deliveryZoneDto.zipCode = null;
      deliveryZoneDto.coordinates = this.drawnCoordinates;
    }

    this.deliveryZoneService.create(deliveryZoneDto).subscribe({
      next: deliveryZoneDto => {
        this.router.navigate(['/delivery-zones']);
        this.toaster.success('::DeliveryZoneSavedSuccessfully');
      },
      error: () => {
        this.toaster.error('::DeliveryZoneSaveError');
      },
    });
  }

  close() {
    this.router.navigate(['/delivery-zones']);
  }

  onZoneAreaSelectorChange(event) {
    if (event.value === ZoneAreaSelector.Coordinates) {
      this.addCoordinate();
      this.addCoordinate();
      this.addCoordinate();
      this.form.get('zipCode')?.clearValidators();
      this.drawOnMapEnabled = false;
    } else if (event.value === ZoneAreaSelector.ZipCode) {
      this.coordinates.clear();
      this.form.get('zipCode')?.setValidators([Validators.required]);
      this.drawOnMapEnabled = false;
    } else {
      this.coordinates.clear();
      this.form.get('zipCode')?.clearValidators();
      this.drawOnMapEnabled = true;
    }
    this.form.get('zipCode')?.updateValueAndValidity();
  }

  get coordinates(): FormArray {
    return this.form.get('deliveryZoneCoordinates') as FormArray;
  }

  addCoordinate() {
    this.coordinates.push(
      this.fb.group({
        latitude: [0, Validators.required],
        longitude: [0, Validators.required],
        displayOrder: [this.coordinates.length + 1, Validators.required],
      }),
    );
  }

  removeCoordinate(index: number): void {
    this.coordinates.removeAt(index);
    this.updateDisplayOrders();
  }

  updateDisplayOrders(): void {
    this.coordinates.controls.forEach((group, index) => {
      group.get('displayOrder')?.setValue(index + 1);
    });
  }

  generateMap(): void {
    this.zoneCoordinates = this.form.get('deliveryZoneCoordinates').value;
  }

  onMapDrawn(coordinates: DeliveryZoneCoordinateDto[]) {
    this.drawnCoordinates = coordinates;
  }

  getAvailableStores() {
    this.storeService.getStoreLookup().subscribe(response => {
      this.availableStores = response.items;
    });
  }
}
