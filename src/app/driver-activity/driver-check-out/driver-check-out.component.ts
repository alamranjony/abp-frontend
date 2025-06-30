import { ToasterService } from '@abp/ng.theme.shared';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { Router } from '@angular/router';
import { DeliveryControlService, DriverCheckOutDto } from '@proxy/delivery-management';
import { TripService } from '@proxy/trips';
import { VehicleDto, VehicleService } from '@proxy/vehicles';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { DEBOUNCE_TIME } from 'src/app/shared/constants';

@Component({
  selector: 'app-driver-check-out',
  templateUrl: './driver-check-out.component.html',
  styleUrls: ['./driver-check-out.component.scss'],
})
export class DriverCheckOutComponent implements OnInit {
  checkOutForm: FormGroup;
  trips: any[] = [];
  destroy$: Subject<void> = new Subject();
  selectedStoreIds: string[] = [];
  selectedTrip: string = '';
  vehicles: VehicleDto[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly deliveryControlService: DeliveryControlService,
    private readonly tripService: TripService,
    private readonly vehicleService: VehicleService,
    private readonly toasterService: ToasterService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.listenForFormChanges();
    this.fetchVehicles();
  }

  buildForm() {
    this.checkOutForm = this.fb.group({
      deliveryDate: [new Date(), Validators.required],
      employeeId: ['', Validators.required],
      pin: ['', Validators.required],
      vehicleId: [null, Validators.required],
      mileage: [{ value: null, disabled: true }, Validators.required],
      tripId: [null, Validators.required],
    });
  }

  fetchVehicles(): void {
    this.vehicleService
      .getVehicleList()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.vehicles = result;
      });
  }

  listenForFormChanges(): void {
    this.checkOutForm
      .get('deliveryDate')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.checkAndFetchTrips();
      });
      
    this.checkOutForm
      .get('employeeId')
      ?.valueChanges.pipe(debounceTime(DEBOUNCE_TIME), takeUntil(this.destroy$))
      .subscribe(_ => {
        this.checkAndFetchTrips();
      });
  }

  onDeliveryDateChange(event: any): void {
    this.checkAndFetchTrips();
  }

  checkAndFetchTrips(): void {
    const deliveryDate = this.checkOutForm.get('deliveryDate')?.value;
    const employeeId = this.checkOutForm.get('employeeId')?.value;

    if (deliveryDate && employeeId) {
      this.fetchTrips();
    } else {
      this.trips = [];
    }
  }

  onTripSelect(event: MatSelectChange): void {
    this.selectedTrip = event.value;
    this.checkOutForm.patchValue({ selectedTrip: event.value });
  }

  fetchTrips(): void {
    const deliveryDate = this.checkOutForm.get('deliveryDate')?.value;
    const employeeId = this.checkOutForm.get('employeeId')?.value;

    if (!deliveryDate || !employeeId) {
      this.trips = [];
      return;
    }

    this.tripService
      .getTripsByDateAndEmployeeId(deliveryDate.toDateString(), employeeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(trips => {
        this.trips = trips;
      });
  }

  onSubmit(): void {
    if (this.checkOutForm.invalid) {
      this.toasterService.error('::ValidationError:InvalidFormOrData');
      return;
    }

    const requestDto: DriverCheckOutDto = {
      ...this.checkOutForm.value,
      deliveryDate: (this.checkOutForm.get('deliveryDate')?.value as Date).toLocaleDateString(),
    };

    this.deliveryControlService
      .driverCheckOut(requestDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toasterService.success('::DriverCheckedOutSuccess');
          this.onReset();
          this.router.navigate(['/deliveryManagement/delivery-control']);
        },
        error: () => {
          this.toasterService.error('::DriverCheckedOutFailed');
        },
      });
  }

  getVehicle(vehicleId: string) {
    this.vehicleService
      .get(vehicleId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(vehicle => {
        this.checkOutForm.patchValue({
          mileage: vehicle.mileage,
        });
      });
  }

  onVehicleSelect(vehicleId: string) {
    this.getVehicle(vehicleId);
  }

  onReset(): void {
    this.checkOutForm.reset();
    this.trips = [];
  }
}
