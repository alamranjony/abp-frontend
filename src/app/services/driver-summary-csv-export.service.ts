import { Injectable, OnDestroy } from '@angular/core';
import * as XLSX from 'xlsx';
import { Subject, takeUntil } from 'rxjs';
import { ToasterService } from '@abp/ng.theme.shared';
import { TripService } from '@proxy/trips';
import {
  DriverSummaryListItemDto,
  FilterTripsRequestDto,
  tripStatusTypeOptions,
} from '@proxy/delivery-management';

@Injectable({
  providedIn: 'root',
})
export class DriverSummaryCsvExportService implements OnDestroy {
  private destroy$: Subject<void> = new Subject();

  constructor(
    private tripService: TripService,
    private toasterService: ToasterService,
  ) {}

  exportDriverSummaryXlsx(input: FilterTripsRequestDto): void {
    this.tripService
      .getTripWithDriverInfo(input)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.exportToXlsx(data);
        },
        error: () => {
          this.toasterService.error('::Export.Error');
        },
      });
  }

  exportToXlsx(driverList: DriverSummaryListItemDto[]): void {
    const headers: string[] = [
      'Driver_Name',
      'Phone_Number',
      'Vehicle_Model',
      'Vehicle_Id',
      'Trip_Status',
      'CheckOut_Time',
      'CheckIn_Time',
      'ETA',
    ];

    const rows = driverList.map(driver => [
      driver.driverName ?? '-',
      driver.phoneNumber ?? '-',
      driver.vehicleModel ?? '-',
      driver.vehicleNo ?? '-',
      this.getEnumDisplayName(tripStatusTypeOptions, driver.tripStatusType),
      driver.checkedOutAt ?? '-',
      driver.checkedInAt ?? '-',
      driver.eta ?? '-',
    ]);

    const timestamp = new Date()
      .toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })
      .replace(/[/, ]/g, '_')
      .replace(/:/g, '_');

    const filename = `Driver_Summary_${timestamp}.xlsx`;
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DriverSummary');
    XLSX.writeFile(workbook, filename);
  }

  private getEnumDisplayName(enumOptions: any[], enumValue: number): string {
    const option = enumOptions.find(option => option.value === enumValue);
    return option ? option.key : '-';
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
