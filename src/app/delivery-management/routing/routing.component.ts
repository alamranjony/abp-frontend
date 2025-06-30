import { ToasterService } from '@abp/ng.theme.shared';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DeliveryControlService, FilterTripsRequestDto } from '@proxy/delivery-management';
import { DeliveryControlRouteCreationDialogComponent } from '../delivery-control-route-creation-dialog/delivery-control-route-creation-dialog.component';
import { StoreLookupDto, StoreService } from '@proxy/stores';
import { EmployeeDto } from '@proxy/employees';
import { forkJoin, Subject, take, takeUntil } from 'rxjs';
import { TripDto, TripService } from '@proxy/trips';
import { StoreDataService } from 'src/app/store/store.data.service';

@Component({
  selector: 'app-routing',
  templateUrl: './routing.component.html',
  styleUrl: './routing.component.scss',
})
export class RoutingComponent implements OnInit {
  trips: TripDto[] = [];
  selectedTripIds: string[] = [];
  stores: StoreLookupDto[] = [];
  drivers: EmployeeDto[] = [];
  selectedDriverId: string = '';
  columns: string[] = [
    'customTripId',
    'driver',
    'vehicleId',
    'tripStatus',
    'noOfDeliveries',
    'checkoutTime',
    'checkInTime',
    'eta',
    'tripDate',
    'action',
  ];
  filterDate: Date;
  selectedStoreIds: string[] = [];
  destroy$: Subject<void> = new Subject();
  currentStore: StoreLookupDto;
  isDifferentStoreSelected: boolean = false;

  constructor(
    private readonly deliveryControlService: DeliveryControlService,
    private readonly tripService: TripService,
    private readonly storeService: StoreService,
    private readonly toasterService: ToasterService,
    public dialog: MatDialog,
    private readonly storeDataService: StoreDataService,
  ) {}

  ngOnInit(): void {
    this.filterDate = new Date();
    this.loadStores();
    this.getDrivers();
  }

  onResetFilters() {
    this.filterDate = null;
    this.selectedDriverId = null;
    let input: FilterTripsRequestDto = {
      deliveryDate: this.filterDate?.toDateString(),
      storeIds: this.selectedStoreIds,
      driverId: this.selectedDriverId,
    };
    this.loadTrips(input);
  }

  loadStores(): void {
    forkJoin({
      stores: this.storeService.getStoreLookup(),
      currentStore: this.storeDataService.currentStore$.pipe(take(1)),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.currentStore = result.currentStore;
        this.stores = result.stores.items;
        this.selectedStoreIds = [result.currentStore.id];
        this.prepareInitialData();
      });
  }

  clearRouteDate(): void {
    this.filterDate = null;
  }

  prepareInitialData(): void {
    let input: FilterTripsRequestDto = {
      deliveryDate: this.filterDate?.toDateString(),
      storeIds: this.selectedStoreIds,
      driverId: this.selectedDriverId,
    };
    this.loadTrips(input);
  }

  loadTrips(input: FilterTripsRequestDto): void {
    this.tripService
      .getTrips(input)
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.trips = result;
      });
  }

  getDrivers() {
    this.deliveryControlService
      .getAllDriverList()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.drivers = result.items;
      });
  }

  onFromDateChange(event: any): void {
    this.filterDate = event.value;
    let input: FilterTripsRequestDto = {
      deliveryDate: this.filterDate?.toDateString(),
      storeIds: this.selectedStoreIds,
      driverId: this.selectedDriverId,
    };
    this.loadTrips(input);
  }

  onFilter(): void {
    this.prepareInitialData();
  }

  isSelected(element: any): boolean {
    return this.selectedTripIds.includes(element.id);
  }

  onStoreSelect(selectedIds: string[]): void {
    this.selectedStoreIds = selectedIds.length === 0 ? [this.currentStore.id] : selectedIds;

    this.isDifferentStoreSelected = this.stores.some(
      store => store.id !== this.currentStore.id && this.selectedStoreIds.includes(store.id),
    );
    this.prepareInitialData();
  }

  onDriverChange(driverId: string): void {
    this.selectedDriverId = driverId;
    let input: FilterTripsRequestDto = {
      deliveryDate: this.filterDate.toDateString(),
      storeIds: this.selectedStoreIds,
      driverId: this.selectedDriverId,
    };
    this.loadTrips(input);
  }

  onClickEditBtn(tripId: string): void {
    if (this.isDifferentStoreSelected) {
      this.showDifferentStoreWarning();
      return;
    }

    const dialogRef = this.dialog.open(DeliveryControlRouteCreationDialogComponent, {
      width: '2000px',
      data: {
        selectedTripId: tripId,
        isEditMode: true,
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(_ => {
        this.prepareInitialData();
      });
  }

  onClickDeleteBtn(tripId: string): void {
    if (this.isDifferentStoreSelected) {
      this.showDifferentStoreWarning();
      return;
    }

    this.tripService.delete(tripId).subscribe(() => {
      this.toasterService.success('::Trip:TripDeleted');
      this.prepareInitialData();
    });
  }

  showDifferentStoreWarning() {
    this.toasterService.warn('::CurrentStoreWarningMessage');
  }
}
