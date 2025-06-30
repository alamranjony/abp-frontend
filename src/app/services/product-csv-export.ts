import { Injectable } from '@angular/core';
import { LocalizationService, PagedResultDto } from '@abp/ng.core';
import { ProductDto, productStatusOptions } from '@proxy/products';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, map, Observable, tap } from 'rxjs';
import { ProductService } from '@proxy/products';
import { StoreService } from '@proxy/stores';
import * as XLSX from 'xlsx';
import { ToasterService } from '@abp/ng.theme.shared';

@Injectable({
  providedIn: 'root',
})
export class ProductCsvExportService {
  private readonly baseUrl = environment.apis.default.url + '/api';
  constructor(
    private http: HttpClient,
    private productService: ProductService,
    private storeService: StoreService,
    private toasterService: ToasterService,
    private localizationService: LocalizationService,
  ) {}

  private async getStoreCode(storeId: string): Promise<string> {
    const store = await firstValueFrom(this.storeService.get(storeId));
    return store ? store.storeCode : 'Unknown Store Code';
  }

  fetchData(apiUrl: string, queryParams: { [key: string]: any } = {}): Observable<any[]> {
    const allResults: any = [];
    let skipCount: number = 0;
    const maxResultCount: number = 1000;

    const fetchNextBatch = (): Observable<any[]> => {
      queryParams['skipCount'] = skipCount;
      queryParams['maxResultCount'] = maxResultCount;

      return this.http.get<any[]>(`${this.baseUrl}/${apiUrl}`, { params: queryParams }).pipe(
        tap(results => {
          allResults.push(...results);
          if (results.length === maxResultCount) {
            skipCount += maxResultCount;
            return fetchNextBatch();
          }
        }),
      );
    };

    return fetchNextBatch().pipe(
      map(() => allResults), // Once all batches are fetched, return the accumulated results
    );
  }

  exportProductsCsv(): void {
    const allProducts: ProductDto[] = [];
    const maxResultCount: number = 1000;
    let skipCount: number = 0;

    const fetchBatch = () => {
      this.fetchProducts(skipCount, maxResultCount).subscribe(response => {
        allProducts.push(...response.items);
        if (response.totalCount > skipCount + maxResultCount) {
          skipCount += maxResultCount;
          fetchBatch();
        } else {
          if (allProducts.length === 0) {
            this.toasterService.warn('::NoProductToExport');
            return;
          }
          this.exportToExcel(allProducts);
        }
      });
    };
    fetchBatch();
  }

  fetchProducts(skipCount: number, maxResultCount: number): Observable<PagedResultDto<ProductDto>> {
    return this.productService.getList({
      skipCount: skipCount,
      maxResultCount: maxResultCount,
    });
  }

  async exportToExcel(products: ProductDto[]): Promise<void> {
    const headers: string[] = [
      'Product_Code*',
      'Type*',
      'Status*',
      'SKU',
      'Department',
      'Name*',
      'Description*',
      'Corporate_Level*',
      'Store_Code',
      'Commissionable',
      'Non_Taxable_Status',
      'Base_Price',
      'Mid_Price',
      'High_Price',
      'Allow_Base_Price_Override',
      'Inventory_Tracking_Status',
      'Inventory_Number',
      'Allow_Out_of_Stock_Sale',
      'Seasonal',
      'Seasonal_Pricing',
      'Seasonal_Price',
      'Seasonal_Start_Date',
      'Seasonal_End_Date',
    ];

    const yes = this.localizationService.instant('::Yes');
    const no = this.localizationService.instant('::No');

    const rows = await Promise.all(
      products.map(async product => [
        product.productCode,
        product.productType,
        productStatusOptions.find(x => x.value === product.status)?.key,
        product.sku,
        product.department,
        product.name,
        product.description,
        product.corporateLevel ? yes : no,
        product.corporateLevel ? '' : await this.getStoreCode(product.storeId),
        product.isCommisionable ? yes : no,
        product.isNonTaxable ? yes : no,
        product.basePrice.toString(),
        product.midPrice.toString(),
        product.highPrice.toString(),
        product.isBasePriceOverriden ? yes : no,
        product.isTrackingInventoryEnabled ? yes : no,
        product.onHandQuantity.toString(),
        product.isOutOfStockSalesEnabled ? yes : no,
        product.isSeasonal ? yes : no,
        product.isSeasonalPricingEnabled ? yes : no,
        product.seasonalPrice.toString(),
        product.seasonalAvailabilityStartDate
          ? new Date(product.seasonalAvailabilityStartDate).toLocaleDateString()
          : '',
        product.seasonalAvailabilityEndDate
          ? new Date(product.seasonalAvailabilityEndDate).toLocaleDateString()
          : '',
      ]),
    );

    const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

    const range = XLSX.utils.decode_range(worksheet['!ref']!);
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;

      worksheet[cellAddress].s = {
        font: {
          bold: true,
        },
      };
    }

    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    const link: HTMLAnchorElement = document.createElement('a');
    const url: string = URL.createObjectURL(blob);
    link.href = url;
    link.download = 'products.xlsx';
    link.click();
    URL.revokeObjectURL(url);
  }
}
