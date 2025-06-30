import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  DeliveryControlService,
  DriverSummaryListItemDto,
  FilterTripsRequestDto,
  tripStatusTypeOptions,
} from '@proxy/delivery-management';
import { EmployeeDto } from '@proxy/employees';
import { StoreLookupDto, StoreService } from '@proxy/stores';
import {
  DeliveryAddressPrintDto,
  TripDeliveryInfoPrintDto,
  TripProductDetailsDto,
  TripService,
} from '@proxy/trips';
import { catchError, forkJoin, Subject, take, takeUntil } from 'rxjs';
import { DriverSummaryCsvExportService } from 'src/app/services/driver-summary-csv-export.service';
import { DriverSummaryReportService } from 'src/app/services/reports/driver-summary-report.service';
import { CreatePrintJobDto, PrintJobType, PrintNodeService } from '@proxy/print-node';
import { TripDeliveryAddressPrintService } from 'src/app/services/trip-delivery-address-print.service';
import { ToasterService } from '@abp/ng.theme.shared';
import { StoreDataService } from 'src/app/store/store.data.service';

@Component({
  selector: 'app-driver-summary',
  templateUrl: './driver-summary.component.html',
  styleUrl: './driver-summary.component.scss',
})
export class DriverSummaryComponent implements OnInit {
  trips: DriverSummaryListItemDto[] = [];
  stores: StoreLookupDto[] = [];
  drivers: EmployeeDto[] = [];
  selectedDriverId: string = '';
  columns: string[] = [
    'driverName',
    'phoneNumber',
    'vehicleModel',
    'vehicleNo',
    'tripStatus',
    'checkoutTime',
    'checkInTime',
    'eta',
  ];
  routeDate: Date;
  selectedStoreIds: string[] = [];
  tripStatusTypes = tripStatusTypeOptions;
  selectedTripStatus: any;
  destroy$: Subject<void> = new Subject();
  currentStore: StoreLookupDto;

  currentTimeText: string;
  etaText: string;
  assignedToText: string;
  deliveryForText: string;
  itemsText: string;
  phoneText: string;
  codMessageText: string;
  codOfText: string;
  filledText: string;
  codeText: string;
  timeText: string;
  printNameText: string;

  constructor(
    private readonly deliveryControlService: DeliveryControlService,
    private readonly tripService: TripService,
    private readonly storeService: StoreService,
    private readonly driverSummaryCSVService: DriverSummaryCsvExportService,
    private readonly deriverSummaryReportService: DriverSummaryReportService,
    private readonly tripDeliveryAddressPrintService: TripDeliveryAddressPrintService,
    private readonly printNodeService: PrintNodeService,
    private readonly toasterService: ToasterService,
    public dialog: MatDialog,
    private readonly storeDataService: StoreDataService,
  ) {}

  ngOnInit(): void {
    this.routeDate = new Date();
    this.loadStores();
    this.getDrivers();
  }

  onResetFilters() {
    this.routeDate = null;
    this.selectedDriverId = null;
    this.selectedTripStatus = null;
    this.loadTrips(this.buildFilterInput());
  }

  onFilter(): void {
    this.prepareInitialData();
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

  getDrivers() {
    this.deliveryControlService
      .getAllDriverList()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.drivers = result.items;
      });
  }

  prepareInitialData(): void {
    this.loadTrips(this.buildFilterInput());
  }

  loadTrips(input: FilterTripsRequestDto): void {
    this.tripService
      .getTripWithDriverInfo(input)
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.trips = result;
      });
  }

  onTripStatusChange(event: any): void {
    this.selectedTripStatus = event;
    this.loadTrips(this.buildFilterInput());
  }

  onFromDateChange(event: any): void {
    this.routeDate = event.value;
    this.loadTrips(this.buildFilterInput());
  }

  private buildFilterInput(): FilterTripsRequestDto {
    return {
      deliveryDate: this.routeDate?.toDateString(),
      storeIds: this.selectedStoreIds,
      driverId: this.selectedDriverId,
      tripStatus: this.selectedTripStatus,
    };
  }

  clearRouteDate(): void {
    this.routeDate = null;
  }

  onStoreSelect(selectedIds: string[]): void {
    this.selectedStoreIds = selectedIds.length === 0 ? [this.currentStore.id] : selectedIds;
    this.prepareInitialData();
  }

  onDriverSelect(driverId: string): void {
    this.selectedDriverId = driverId;
  }

  exportData(): void {
    const filterData = this.buildFilterInput();
    this.driverSummaryCSVService.exportDriverSummaryXlsx(filterData);
  }

  print(): void {
    if (!this.selectedDriverId) {
      this.toasterService.error('::DeliveryTripPrint:NoDriverSelected');
      return;
    }

    this.tripService
      .getTripDetailsForPrinting(
        this.selectedDriverId,
        this.routeDate?.toDateString(),
        this.selectedTripStatus,
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: TripDeliveryInfoPrintDto[]) => {
        if (result && result.length > 0) {
          result.forEach((tripDelivery: TripDeliveryInfoPrintDto, index: number) => {
            tripDelivery.driverName = tripDelivery.driverName?.toUpperCase();
            tripDelivery.eta = tripDelivery.eta?.toUpperCase();
            tripDelivery.deliveryAddresses = tripDelivery.deliveryAddresses.map(
              (deliverAddress: DeliveryAddressPrintDto) => {
                deliverAddress = {
                  ...deliverAddress,
                  tripPin: `${index + 1} ${deliverAddress.tripPin?.toUpperCase()}`,
                  occasionCode: deliverAddress.occasionCode,
                  timeRequirement: this.convertTo12HourFormat(
                    deliverAddress.timeRequirement,
                  )?.toUpperCase(),
                  deliveryInstruction: deliverAddress.deliveryInstruction?.toUpperCase(),
                  zoneCode: deliverAddress.zoneCode?.toUpperCase(),
                  recipientName: deliverAddress.recipientName?.toUpperCase(),
                  address1: deliverAddress.address1?.toUpperCase(),
                  city: deliverAddress.city?.toUpperCase(),
                  state: deliverAddress.state?.toUpperCase(),
                  zipCode: deliverAddress.zipCode?.toUpperCase(),
                  slotName: deliverAddress.slotName?.toUpperCase(),
                  tripProductDetails: deliverAddress.tripProductDetails.map(
                    (product: TripProductDetailsDto) => ({
                      ...product,
                      productName: product.productName?.toUpperCase(),
                      productDescription: product.productDescription?.toUpperCase(),
                    }),
                  ),
                };
                return deliverAddress;
              },
            );

            let pdf = this.tripDeliveryAddressPrintService.generatePdf(tripDelivery);

            pdf.save('Driver_Summary_Report.pdf');
            let createPrintJobDto = {
              source: 'Driver Summary Report',
              title: 'Driver Summary Report',
              printJobType: PrintJobType.LocalOrder,
              base64Content: pdf.output('datauristring').split(',')[1],
            } as CreatePrintJobDto;

            this.printNodeService
              .createPrintJob(createPrintJobDto)
              .pipe(
                takeUntil(this.destroy$),
                catchError(_ => {
                  this.toasterService.error('::DeliveryTripPrint:ErrorCreatingPrintJob');
                  return [];
                }),
              )
              .subscribe({
                next: () => {},
                error: () => {},
              });
          });
        }
      });
  }

  printData(): void {
    const filterData = this.buildFilterInput();
    const selectedEmployee = this.drivers.find(e => e.id === this.selectedDriverId)?.displayName;
    const selectedStores = this.stores
      .filter(c => this.selectedStoreIds.includes(c.id))
      ?.map(c => c.storeName);

    this.deriverSummaryReportService.generateReport(filterData, selectedEmployee, selectedStores);
  }

  convertTo12HourFormat(time: string): string {
    if (!time) return '';
    const [hourStr, minuteStr] = time.split(':');
    let hour = parseInt(hourStr, 10);
    if (isNaN(hour)) return '';
    const minute = minuteStr || '00';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `BY ${hour}:${minute} ${ampm}`;
  }
}
