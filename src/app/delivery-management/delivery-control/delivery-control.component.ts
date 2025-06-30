import { Component, OnInit } from '@angular/core';
import {
  DeliveryControlService,
  DeliveryControlSlotDetailsDto,
  DriverAvailabilitySummaryDto,
  FilterPagedAndSortedDeliveryControlResultRequestDto,
} from '@proxy/delivery-management';
import { StoreLookupDto, StoreService } from '@proxy/stores';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { ToasterService } from '@abp/ng.theme.shared';
import { DeliveryControlEditSlotDialogComponent } from '../delivery-control-edit-slot-dialog/delivery-control-edit-slot-dialog.component';
import { DeliveryControlBulkDateChangeComponent } from '../delivery-control-bulk-date-change/delivery-control-bulk-date-change.component';
import { Router } from '@angular/router';
import { DeliveryControlRouteCreationDialogComponent } from '../delivery-control-route-creation-dialog/delivery-control-route-creation-dialog.component';
import { forkJoin, Subject, take, takeUntil } from 'rxjs';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { StoreDataService } from 'src/app/store/store.data.service';

@Component({
  selector: 'app-delivery-control',
  templateUrl: './delivery-control.component.html',
  styleUrls: ['./delivery-control.component.scss'],
})
export class DeliveryControlComponent implements OnInit {
  slots: DeliveryControlSlotDetailsDto[] = [];
  selectedSlots: string[] = [];
  stores: StoreLookupDto[] = [];
  columns: string[] = [
    'select',
    'slotName',
    'hotOrders',
    'nextCutOff',
    'notFilled',
    'packageReady',
    'toBeDelivered',
    'routed',
    'outOnDelivery',
    'alreadyDelivered',
  ];

  filterDate: Date = new Date();
  filterDateInUtc: string;

  selectedStoreIds: string[] = [];
  availableDrivers: number = 0;
  outDrivers: number = 0;
  inDrivers: number = 0;
  modeName: string = '';
  destroy$: Subject<void> = new Subject();

  driverStatusSummaryDto: DriverAvailabilitySummaryDto;
  deliveryModeId: string;
  currentStore: StoreLookupDto;
  isDifferentStoreSelected: boolean;

  constructor(
    private readonly deliveryControlService: DeliveryControlService,
    private readonly storeService: StoreService,
    private readonly toasterService: ToasterService,
    public dialog: MatDialog,
    private readonly router: Router,
    private readonly storeDataService: StoreDataService,
  ) {}

  ngOnInit(): void {
    this.filterDateInUtc = this.convertDateTimeToUtcDate(new Date());
    this.loadStores();
    this.getDriverAvailabilityStatusCount();
  }

  getDriverAvailabilityStatusCount() {
    this.deliveryControlService
      .getDriverAvailabilitySummary(this.filterDate.toLocaleString())
      .pipe(takeUntil(this.destroy$))
      .subscribe((driverStatusSummaryDto: DriverAvailabilitySummaryDto) => {
        this.driverStatusSummaryDto = driverStatusSummaryDto;
      });
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

  prepareInitialData(): void {
    let input: FilterPagedAndSortedDeliveryControlResultRequestDto = {
      deliveryDate: this.filterDate.toLocaleString(),
      storeIds: this.selectedStoreIds,
    };
    this.loadSlots(input);
  }

  loadSlots(input?: FilterPagedAndSortedDeliveryControlResultRequestDto): void {
    this.deliveryControlService
      .getDeliverySlotList(input)
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.slots = result.deliveryControlSlotDetailsDto;
        this.availableDrivers = result.availableDriver;
        this.outDrivers = result.outDriver;
        this.inDrivers = result.inDriver;
        this.modeName = result.modeName;
        this.deliveryModeId = result.deliverModeId;
      });
  }

  onDeliveryDateChange(event: MatDatepickerInputEvent<Date>): void {
    this.filterDateInUtc = this.convertDateTimeToUtcDate(event.target.value);

    this.filterDate = event.target.value;
    this.filterDate.setHours(new Date().getHours());
    this.filterDate.setMinutes(new Date().getMinutes());
    this.selectedSlots = [];

    let input: FilterPagedAndSortedDeliveryControlResultRequestDto = {
      deliveryDate: this.filterDate.toLocaleString(),
      storeIds: this.selectedStoreIds,
    };
    this.loadSlots(input);
    this.getDriverAvailabilityStatusCount();
  }

  isSelected(element: any): boolean {
    return this.selectedSlots.includes(element.slotId);
  }

  toggleSelection(element: any) {
    const index = this.selectedSlots.indexOf(element.slotId);
    if (index >= 0) {
      this.selectedSlots.splice(index, 1);
    } else {
      this.selectedSlots.push(element.slotId);
    }
  }

  toggleSelectAll(event: MatCheckboxChange) {
    this.selectedSlots = event.checked ? this.slots.map(slot => slot.slotId) : [];
  }

  isAllSelected(): boolean {
    return this.selectedSlots.length === this.slots.length;
  }

  isSomeSelected(): boolean {
    return this.selectedSlots.length > 0 && this.selectedSlots.length < this.slots.length;
  }

  onStoreSelect(selectedIds: string[]): void {
    this.selectedSlots = [];
    this.isDifferentStoreSelected = this.stores.some(
      store => store.id !== this.currentStore.id && this.selectedStoreIds.includes(store.id),
    );
    
    this.selectedStoreIds = selectedIds.length === 0 ? [this.currentStore.id] : selectedIds;

    this.prepareInitialData();
  }

  navigateToCalender() {
    this.router.navigate(['/calendar']);
  }

  createRoute(): void {
    if (this.selectedSlots.length === 0) {
      this.toasterService.warn('::SelectSlotWarn');
      return;
    }

    if (this.isDifferentStoreSelected) {
      this.showDifferentStoreWarning();
      return;
    }

    const dialogRef = this.dialog.open(DeliveryControlRouteCreationDialogComponent, {
      width: '2000px',
      data: {
        selectedSlots: this.selectedSlots,
        selectedDate: this.filterDate.toLocaleString(),
        storeId: this.selectedStoreIds[0],
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.router.navigate(['/deliveryManagement/routing']);
        }
      });
  }

  editSlot(): void {
    if (this.selectedSlots.length === 0) {
      this.toasterService.warn('::SelectSlotWarn');
      return;
    }

    if (this.isDifferentStoreSelected) {
      this.showDifferentStoreWarning();
      return;
    }

    const dialogRef = this.dialog.open(DeliveryControlEditSlotDialogComponent, {
      width: '800px',
      data: {
        selectedSlots: this.selectedSlots,
        selectedDate: this.filterDate.toLocaleString(),
        deliveryModeId: this.deliveryModeId,
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(_ => {
        this.prepareInitialData();
      });
  }

  bulkDateChange(): void {
    if (this.selectedSlots.length === 0) {
      this.toasterService.warn('::SelectSlotWarn');
      return;
    }

    if (this.isDifferentStoreSelected) {
      this.showDifferentStoreWarning();
      return;
    }

    const dialogRef = this.dialog.open(DeliveryControlBulkDateChangeComponent, {
      width: '500px',
      data: {
        selectedSlots: this.selectedSlots,
        selectedDate: this.filterDate.toLocaleString(),
        storeId: this.selectedStoreIds[0],
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(_ => {
        this.selectedSlots = [];
        this.prepareInitialData();
      });
  }

  convertDateTimeToUtcDate(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
  }

  showDifferentStoreWarning() {
    this.toasterService.warn('::CurrentStoreWarningMessage');
  }
}
