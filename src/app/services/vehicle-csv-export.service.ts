import { Injectable } from '@angular/core';
import { PagedResultDto } from '@abp/ng.core';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { VehicleDto, VehicleService } from '@proxy/vehicles';
import * as XLSX from 'xlsx';
import { ApiResponse, QueryParams } from './services.interface';
import { MAX_RESULT_COUNT } from '../shared/constants';
import { ToasterService } from '@abp/ng.theme.shared';

@Injectable({
  providedIn: 'root',
})
export class VehicleCsvExportService {
  private readonly baseUrl = `${environment.apis.default.url}/api`;
  constructor(
    private http: HttpClient,
    private vehicleService: VehicleService,
    private toasterService: ToasterService,
  ) {}

  fetchData(apiUrl: string, queryParams: QueryParams = {}): Observable<ApiResponse[]> {
    const allResults: ApiResponse[] = [];
    let skipCount: number = 0;
    const maxResultCount: number = MAX_RESULT_COUNT;

    const fetchNextBatch = (): Observable<ApiResponse[]> => {
      queryParams['skipCount'] = skipCount;
      queryParams['maxResultCount'] = maxResultCount;

      return this.http
        .get<ApiResponse[]>(`${this.baseUrl}/${apiUrl}`, { params: queryParams })
        .pipe(
          tap(results => {
            allResults.push(...results);
            if (results.length === maxResultCount) {
              skipCount += maxResultCount;
              return fetchNextBatch();
            }
          }),
        );
    };
    return fetchNextBatch().pipe(map(() => allResults));
  }

  exportVehicleCsv(): void {
    const allProducts: VehicleDto[] = [];
    const maxResultCount: number = MAX_RESULT_COUNT;
    let skipCount: number = 0;

    const fetchBatch = () => {
      this.fetchVehicles(skipCount, maxResultCount).subscribe(response => {
        allProducts.push(...response.items);
        if (response.totalCount > skipCount + maxResultCount) {
          skipCount += maxResultCount;
          fetchBatch();
        } else {
          if (allProducts.length === 0) {
            this.toasterService.warn('No vehicles to export');
            return;
          }
          this.exportToXlsx(allProducts);
        }
      });
    };
    fetchBatch();
  }

  fetchVehicles(skipCount: number, maxResultCount: number): Observable<PagedResultDto<VehicleDto>> {
    return this.vehicleService.getList({
      skipCount: skipCount,
      maxResultCount: maxResultCount,
    });
  }

  async exportToXlsx(vehicles: VehicleDto[]): Promise<void> {
    const headers: string[] = [
      'License Plate',
      'Name',
      'VIN',
      'Model',
      'Status',
      'Expiration Date',
      'Maintenance Due',
    ];
    const rows = vehicles.map(vehicle => [
      vehicle.licensePlate,
      vehicle.name,
      vehicle.vin,
      vehicle.model,
      vehicle.status,
      vehicle.expirationDate ? new Date(vehicle.expirationDate).toLocaleDateString() : '',
      vehicle.maintenanceDue ? new Date(vehicle.maintenanceDue).toLocaleDateString() : '',
    ]);
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vehicles');
    XLSX.writeFile(workbook, 'vehicles.xlsx');
  }
}
