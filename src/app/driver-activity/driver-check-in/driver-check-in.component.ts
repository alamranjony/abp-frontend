import { ToasterService } from '@abp/ng.theme.shared';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DeliveryControlService, DriverCheckInDto } from '@proxy/delivery-management';
import { VehicleDto } from '@proxy/vehicles';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-driver-check-in',
  templateUrl: './driver-check-in.component.html',
  styleUrl: './driver-check-in.component.scss',
})
export class DriverCheckInComponent implements OnInit {
  checkInForm: FormGroup;
  destroy$: Subject<void> = new Subject();
  vehicles: VehicleDto[] = [];
  selectedVehicle: VehicleDto;

  constructor(
    private readonly fb: FormBuilder,
    private readonly deliveryControlService: DeliveryControlService,
    private readonly toasterService: ToasterService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.buildForm();
  }

  buildForm() {
    this.checkInForm = this.fb.group({
      deliveryDate: [new Date(), Validators.required],
      employeeId: ['', Validators.required],
      pin: ['', Validators.required],
      vehicleId: ['', Validators.required],
      mileage: ['', Validators.required],
    });
  }

  next(): void {
    if (this.checkInForm.invalid) {
      this.toasterService.error('::ValidationError:InvalidFormOrData');
      return;
    }

    const requestDto: DriverCheckInDto = {
      ...this.checkInForm.value,
      deliveryDate: (this.checkInForm.get('deliveryDate')?.value as Date).toLocaleDateString(),
    };

    if (requestDto.mileage <= this.selectedVehicle.mileage) {
      this.toasterService.error('::InvalidMileage');
      return;
    }

    this.deliveryControlService
      .driverCheckIn(requestDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toasterService.success('::DriverCheckedInSuccess');
          this.router.navigate(['/deliveryManagement/delivery-control']);
        },
        error: () => {
          this.toasterService.error('::DriverCheckedInFailed');
        },
      });
  }

  fetchVehicles(): void {
    const employeeId = this.checkInForm.get('employeeId')?.value;
    const tripDate = (this.checkInForm.get('deliveryDate')?.value as Date).toLocaleDateString();
    if (!employeeId || !tripDate) {
      return;
    }

    this.deliveryControlService
      .getCheckedInVehiclesByEmployeeIdByEmployeeIdAndTripDate(employeeId, tripDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.vehicles = result;
      });
  }

  onVehicleSelected(vehicle: VehicleDto): void {
    this.selectedVehicle = vehicle;
  }
}
