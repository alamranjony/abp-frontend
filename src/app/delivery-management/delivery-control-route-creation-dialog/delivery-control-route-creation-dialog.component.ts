import { ToasterService } from '@abp/ng.theme.shared';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  DeliveryControlService,
  DeliverySlotSubOrderMapDto,
  TripStatusType,
} from '@proxy/delivery-management';
import { EmployeeDto } from '@proxy/employees';
import { SubOrderDeliveryStatus } from '@proxy/orders';
import { TomTomApiKeySettingsService } from '@proxy/tom-tom';
import { CreateUpdateTripDto, TripService, TripWithSubOrderDeliveryDetailsDto } from '@proxy/trips';
import { VehicleDto, VehicleService } from '@proxy/vehicles';
import { Subject, takeUntil } from 'rxjs';
import { generateTomTomOptimizationUrl } from 'src/app/shared/map-utils';

@Component({
  selector: 'app-delivery-control-route-creation-dialog',
  templateUrl: './delivery-control-route-creation-dialog.component.html',
  styleUrl: './delivery-control-route-creation-dialog.component.scss',
})
export class DeliveryControlRouteCreationDialogComponent implements OnInit, OnDestroy {
  deliverySlotSubOrderMapDtos: DeliverySlotSubOrderMapDto[] = [];
  drivers: EmployeeDto[] = [];
  vehicles: VehicleDto[] = [];
  selectedDriverId: string = '';
  tripDate: Date = new Date();
  selectedSubOrders: string[] = [];
  deliveryCoordinates: {
    latitude: string;
    longitude: string;
    displayOrder: number;
    mapPin: string;
  }[] = [];
  isLoading: boolean = true;
  apiKey: string = '';
  columns: string[] = [
    'select',
    'mapPin',
    'dragHandle',
    'storeName',
    'slotName',
    'orderId',
    'address',
    'city',
    'lat',
    'zone',
    'type',
    'dateRange',
  ];
  destroy$: Subject<void> = new Subject();
  trip: TripWithSubOrderDeliveryDetailsDto;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      selectedSlots: string[];
      selectedDate?: string;
      isEditMode?: boolean;
      selectedTripId: string;
    },
    private readonly deliveryControlService: DeliveryControlService,
    private readonly vehicleService: VehicleService,
    public dialogRef: MatDialogRef<DeliveryControlRouteCreationDialogComponent>,
    private readonly toasterService: ToasterService,
    private readonly tomTomApiKeyService: TomTomApiKeySettingsService,
    private readonly tripService: TripService,
  ) {}

  ngOnInit(): void {
    this.tripDate = new Date();
    this.fetchSubOrders(this.data.isEditMode);
    this.fetchVehicles();
    this.loadMapApiSettings();
    this.getDrivers();
  }

  onDriverSelect(driverId: string): void {
    this.selectedDriverId = driverId;
  }

  getDrivers() {
    this.deliveryControlService
      .getAllDriverList()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.drivers = result.items;
      });
  }

  loadMapApiSettings(): void {
    this.tomTomApiKeyService
      .getMapOptionsApiKey()
      .pipe(takeUntil(this.destroy$))
      .subscribe(setting => {
        this.apiKey = setting.apiKey;
      });
  }

  fetchSubOrders(isEditMode: boolean): void {
    if (isEditMode) {
      this.tripService
        .getTripWithSubOrderDetailsIdByTripId(this.data.selectedTripId)
        .pipe(takeUntil(this.destroy$))
        .subscribe((trip: TripWithSubOrderDeliveryDetailsDto) => {
          this.trip = trip;
          this.deliverySlotSubOrderMapDtos = trip.deliverySlotSubOrderMapDtos;
          this.selectedDriverId = trip.driverId;
          this.tripDate = new Date(trip.tripDate);
          this.extractCoordinates();
          this.isLoading = false;
        });
    } else {
      this.deliveryControlService
        .getSubOrdersBySlotIdsAndDate(
          this.data.selectedSlots,
          this.data.selectedDate,
          SubOrderDeliveryStatus.ToBeDelivered,
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe(result => {
          this.deliverySlotSubOrderMapDtos = result.map((item, index) => {
            item.displayCharacter = this.getDisplayCharacter(index + 1);
            return item;
          });
          this.extractCoordinates();
          this.isLoading = false;
        });
    }
  }

  fetchVehicles(): void {
    this.vehicleService
      .getVehicleList()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.vehicles = result;
      });
  }

  extractCoordinates(): void {
    if (this.deliverySlotSubOrderMapDtos) {
      this.deliveryCoordinates = this.deliverySlotSubOrderMapDtos.map(item => ({
        latitude: item.latitude,
        longitude: item.longitude,
        displayOrder: item.displayOrder,
        mapPin: item.displayCharacter,
      }));
    }
  }

  isSelected(element: any): boolean {
    return this.selectedSubOrders.includes(element.id);
  }

  toggleSelection(element: any) {
    const index = this.selectedSubOrders.indexOf(element.id);
    if (index >= 0) {
      this.selectedSubOrders.splice(index, 1);
    } else {
      this.selectedSubOrders.push(element.id);
    }
  }

  toggleSelectAll(event: MatCheckboxChange) {
    this.selectedSubOrders = event.checked
      ? this.deliverySlotSubOrderMapDtos.map(item => item.id)
      : [];
  }

  isAllSelected(): boolean {
    return this.selectedSubOrders.length === this.deliverySlotSubOrderMapDtos.length;
  }

  isSomeSelected(): boolean {
    return (
      this.selectedSubOrders.length > 0 &&
      this.selectedSubOrders.length < this.deliverySlotSubOrderMapDtos.length
    );
  }

  onDrop(event: CdkDragDrop<any[]>): void {
    moveItemInArray(this.deliverySlotSubOrderMapDtos, event.previousIndex, event.currentIndex);

    this.deliverySlotSubOrderMapDtos.forEach((item, index) => {
      item.displayOrder = index + 1;
    });

    this.deliverySlotSubOrderMapDtos = [...this.deliverySlotSubOrderMapDtos];
  }

  createNewTrip(): void {
    const selectedSubOrders = this.deliverySlotSubOrderMapDtos.filter(suborder =>
      this.isSelected(suborder),
    );

    const selectedDeliverySlotSubOrderMapDtos =
      selectedSubOrders.length > 0 ? selectedSubOrders : this.deliverySlotSubOrderMapDtos;

    const tripStatusType = this.data.isEditMode ? this.trip.tripStatusType : TripStatusType.Routed;

    const createUpdateTripDto: CreateUpdateTripDto = {
      driverId: this.selectedDriverId,
      tripStatusType: tripStatusType,
      noOfDeliveries: selectedDeliverySlotSubOrderMapDtos.length,
      tripDate: this.tripDate.toLocaleDateString(),

      createUpdateTripSubOrderMapDtos: selectedDeliverySlotSubOrderMapDtos.map(
        deliverySlotSubOrderMap => ({
          ...deliverySlotSubOrderMap,
        }),
      ),
    };

    this.data.isEditMode
      ? this.updateTrip(this.data.selectedTripId, createUpdateTripDto)
      : this.createTrip(createUpdateTripDto);
  }

  updateTrip(tripId: string, createUpdateTripDto: CreateUpdateTripDto): void {
    this.tripService
      .update(tripId, createUpdateTripDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: result => {
          this.toasterService.success('::TripUpdateSuccess');
          this.dialogRef.close(result);
        },
        error: error => {
          this.toasterService.error('::TripCreationFailed', error);
        },
      });
  }

  createTrip(createUpdateTripDto: CreateUpdateTripDto): void {
    this.tripService
      .create(createUpdateTripDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: result => {
          this.toasterService.success('::TripCreationSuccess');
          this.dialogRef.close(result);
        },
        error: error => {
          this.toasterService.error('::TripCreationFailed', error);
        },
      });
  }

  optimizeRoute(): void {
    if (!this.deliveryCoordinates || this.deliveryCoordinates.length === 0) {
      this.toasterService.warn('::NoCoordinatesToOptimize');
      return;
    }

    const waypoints = this.deliveryCoordinates
      .map(coord => `${coord.latitude},${coord.longitude}`)
      .join(':');

    const routingUrl = generateTomTomOptimizationUrl(waypoints, this.apiKey);
    this.isLoading = true;

    fetch(routingUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to optimize route');
        }
        return response.json();
      })
      .then(data => {
        if (!data.routes || data.routes.length === 0) {
          throw new Error('No optimized route found.');
        }

        const optimizedCoordinates = data.routes[0].legs.flatMap(leg =>
          leg.points.map(point => ({
            latitude: point.latitude.toString(),
            longitude: point.longitude.toString(),
            displayOrder: 0,
            mapPin: '',
          })),
        );

        this.deliveryCoordinates = optimizedCoordinates.map((coord, index) => {
          const matchedOrder = this.deliveryCoordinates.find(
            item => item.latitude === coord.latitude && item.longitude === coord.longitude,
          );

          return {
            ...coord,
            displayOrder: index + 1,
            mapPin: matchedOrder ? matchedOrder.mapPin : String.fromCharCode(65 + index),
          };
        });

        this.deliveryCoordinates = [...this.deliveryCoordinates];

        this.toasterService.success('::RouteOptimizedSuccessfully');
      })
      .catch(error => {
        this.toasterService.error('::RouteOptimizationFailed', error.message);
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  getDisplayCharacter(index: number): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    if (index < 0) {
      throw new Error('Index must be a non-negative integer.');
    }

    if (index < alphabet.length) {
      return alphabet.charAt(index - 1);
    } else {
      const repeatCount = Math.floor(index / alphabet.length) + 1;
      const character = alphabet.charAt(index % alphabet.length);
      return character.repeat(repeatCount);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
