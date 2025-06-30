import { Component, OnInit } from '@angular/core';
import { ListService, PagedResultDto } from '@abp/ng.core';
import { VehicleService, VehicleDto } from '@proxy/vehicles';
import { NgbDateNativeAdapter, NgbDateAdapter } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationService, Confirmation, ToasterService } from '@abp/ng.theme.shared';
import { EXPORT_CONFIG } from '../export/export-config';
import { MatDialog } from '@angular/material/dialog';
import { VehicleDialogComponent } from './vehicle-dialog/vehicle-dialog.component';
import { Sort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';
import { DIALOG_ENTER_ANIMATION_DURATION } from '../shared/dialog.constants';
import { VehicleCsvExportService } from '../services/vehicle-csv-export.service';
import { take } from 'rxjs';

@Component({
  selector: 'app-vehicle',
  templateUrl: './vehicle.component.html',
  styleUrl: './vehicle.component.scss',
  providers: [ListService, { provide: NgbDateAdapter, useClass: NgbDateNativeAdapter }],
})
export class VehicleComponent implements OnInit {
  exportUrl = EXPORT_CONFIG.vehicleUrl;
  exportFieldList = [
    'licensePlate',
    'name',
    'vin',
    'model',
    'statusValue',
    'expirationDate',
    'maintenanceDue',
  ];
  vehicles = { items: [], totalCount: 0 } as PagedResultDto<VehicleDto>;
  columns: string[] = [
    'vehicleNo',
    'licensePlate',
    'name',
    'vin',
    'model',
    'expirationDate',
    'actions',
  ];
  filter: string = '';

  constructor(
    public readonly list: ListService,
    private vehicleService: VehicleService,
    private confirmation: ConfirmationService,
    private dialog: MatDialog,
    private toasterService: ToasterService,
    private vehicleCsvExportService: VehicleCsvExportService,
  ) {}

  ngOnInit() {
    this.loadVehicles();
  }

  handleServiceResponse(successMessage: string, errorMessage: string) {
    return {
      next: () => {
        this.toasterService.success(successMessage);
        this.loadVehicles();
      },
      error: () => this.toasterService.error(errorMessage),
    };
  }

  openVehicleDialog(data: any) {
    return this.dialog.open(VehicleDialogComponent, {
      width: '50%',
      data: data,
      enterAnimationDuration: DIALOG_ENTER_ANIMATION_DURATION,
    });
  }

  createVehicle() {
    const dialogRef = this.openVehicleDialog({ isEditMode: false });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.vehicleService
          .create(result)
          .subscribe(
            this.handleServiceResponse('::Vehicle:VehicleCreated', '::Vehicle:VehicleCreateError'),
          );
      }
    });
  }

  editVehicle(id: string) {
    this.vehicleService.get(id).subscribe(result => {
      if (!result) {
        return;
      }
      const dialogRef = this.openVehicleDialog({ ...result, isEditMode: true });
      dialogRef.afterClosed().subscribe(dialogResult => {
        if (dialogResult) {
          this.vehicleService
            .update(id, dialogResult)
            .subscribe(
              this.handleServiceResponse(
                '::Vehicle:VehicleUpdated',
                '::Vehicle:VehicleUpdateError',
              ),
            );
        }
      });
    });
  }

  onSearch(filter: string): void {
    this.filter = filter;
    this.list.page = 0;
    this.loadVehicles();
  }

  exportCsv() {
    this.vehicleCsvExportService.exportVehicleCsv();
  }

  delete(id: string) {
    this.confirmation.warn('::AreYouSureToDelete', '::AreYouSure').subscribe(status => {
      if (status !== Confirmation.Status.confirm) {
        return;
      }
      this.vehicleService
        .delete(id)
        .subscribe(
          this.handleServiceResponse('::Vehicle:VehicleDeleted', '::Vehicle:VehicleDeleteError'),
        );
    });
  }

  changeSort(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
    this.loadVehicles();
  }

  changePage(event: PageEvent) {
    this.list.page = event.pageIndex;
    this.loadVehicles();
  }

  private loadVehicles() {
    this.list
      .hookToQuery(query =>
        this.vehicleService.getList({
          ...query,
          filter: this.filter,
        }),
      )
      .pipe(take(1))
      .subscribe(response => {
        this.vehicles = response;
      });
  }
}
