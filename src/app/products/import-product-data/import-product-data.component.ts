import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ToasterService } from '@abp/ng.theme.shared';
import * as XLSX from 'xlsx';
import { ProductService } from '@proxy/products';
import { LocalizationService } from '@abp/ng.core';
import { convertExcelDate } from 'src/app/shared/date-time-utils';

@Component({
  selector: 'app-import-product-data',
  templateUrl: './import-product-data.component.html',
  styleUrl: './import-product-data.component.scss',
})
export class ImportProductComponent {
  @Input() apiUrl: string;
  @Input() fileName: string;
  @Input() queryParams: Record<string, any> = {};
  @Input() fieldList?: string[];
  @Output() isProductDataImportDone = new EventEmitter<boolean>();
  @Output() hasImportProcessStarted = new EventEmitter<boolean>();
  @Output() importedDataResponse = new EventEmitter<any>();

  productData: { [key: string]: any }[] = [];
  numberOfProductsImported: number = 0;
  numberOfFailedImports: number = 0;
  importProgress: number = 0;
  errorList: string[] = [];
  isUploading: boolean = false;

  constructor(
    private readonly productService: ProductService,
    private readonly toaster: ToasterService,
    private localizationService: LocalizationService,
  ) {}

  onFileChange(evt: any) {
    const target: DataTransfer = <DataTransfer>evt.target;

    if (target.files.length !== 1) {
      this.toaster.error('::ErrorProductUpload');
      return;
    }

    const file = target.files[0];
    const fileName = file.name.toLowerCase();
    const validExtensions = ['xlsx', 'xls'];
    const fileExtension = fileName.split('.').pop();

    if (!validExtensions.includes(fileExtension)) {
      this.toaster.error('::ImportFileFormatError');
      return;
    }

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });

      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

      this.productData = this.jsonFormatter(data);
    };
    reader.readAsArrayBuffer(file);
  }

  hasValidData(data: any): boolean {
    return (
      data['Product_Code*'] ||
      data['Name*'] ||
      data['Type*'] ||
      data['Corporate_Level*'] ||
      data['Status*']
    );
  }

  importProducts() {
    if (!this.productData || this.productData.length === 0) {
      alert('No data available to import. Please select a file and try again.');
      return;
    }
    const listOfProducts = this.mapJsonToProductDto(this.productData);
    if (listOfProducts.length === 0) {
      this.toaster.error('::NoValidProduct');
      this.importedDataResponse.emit({
        importedProducts: 0,
        failedImports: this.productData.length,
        errors: this.errorList || ['No valid products to import. Please check your data.'],
      });

      setTimeout(() => {
        this.isProductDataImportDone.emit(true);
      }, 1000);
      return;
    }

    const chunkedProductData = this.createChunkArray(listOfProducts, 100);
    const totalBatches = chunkedProductData.length;

    this.importProgress = 0;
    this.hasImportProcessStarted.emit(true);
    this.isUploading = true;

    const importPromises = chunkedProductData.map((chunk, index) => {
      return new Promise<void>((resolve, reject) => {
        this.productService.batchProductImport(chunk).subscribe(
          (response: any) => {
            this.numberOfProductsImported += response.processedProducts;
            this.numberOfFailedImports += response.failedImport;

            if (response.failedProductList && response.failedProductList.length > 0) {
              const backendErrors = response.failedProductList.map((product: any) => {
                return `Product ${product.productCode}: ${product.errorMessages.join(', ')}`;
              });
              this.errorList = [...this.errorList, ...backendErrors];
            }

            this.importProgress = ((index + 1) / totalBatches) * 100;
            resolve();
          },
          (error: any) => {
            this.toaster.error('::ErrorProductUpload');
            reject(new Error(error));
          },
        );
      });
    });

    Promise.all(importPromises.map(promise => promise.catch(error => {})))
      .then(() => {
        this.importedDataResponse.emit({
          importedProducts: this.numberOfProductsImported,
          failedImports: this.numberOfFailedImports,
          errors: this.errorList,
        });

        setTimeout(() => {
          this.isProductDataImportDone.emit(true);
          this.isUploading = false;
        }, 5000);
      })
      .catch(error => {
        this.toaster.error('::ErrorProductUpload');
        this.isUploading = false;
      });
  }

  getLocalizedString(key: string): string {
    return this.localizationService.instant(key);
  }

  isRowEmpty(data: any): boolean {
    return Object.values(data).every(
      value => value === null || value === '' || value === undefined,
    );
  }

  mapJsonToProductDto(jsonData: any[]) {
    const errors: string[] = [];
    const validProducts = [];

    jsonData
      .filter((data, index) => {
        if (this.isRowEmpty(data)) {
          return false;
        }
        return true;
      })
      .forEach((data, index) => {
        const validationErrors = this.validateRow(data, index + 2);

        if (validationErrors) {
          errors.push(validationErrors);
        } else {
          validProducts.push({
            productCode: data['Product_Code*'] ? String(data['Product_Code*']) : '',
            name: data['Name*'],
            description: data['Description*'] || '',
            productType: data['Type*'] ? data['Type*'].trim() : '',
            department: data['Department'] ? data['Department'].trim() : '',
            basePrice: data['Base_Price'] || 0,
            midPrice: data['Mid_Price'] || 0,
            highPrice: data['High_Price'] || 0,
            isBasePriceOverriden: this.convertYesNoToBoolean(
              data['Allow_Base_Price_Override'],
              true,
            ),
            isNonTaxable: this.convertYesNoToBoolean(data['Non_Taxable_Status'], false),
            sku: data['SKU'] || '',
            onHandQuantity: data['Inventory_Number'] || 0,
            isTrackingInventoryEnabled: this.convertYesNoToBoolean(
              data['Inventory_Tracking_Status'],
              false,
            ),
            imageUrl: data['Image_Path'] || '',
            isOutOfStockSalesEnabled: this.convertYesNoToBoolean(
              data['Allow_Out_of_Stock_Sale'],
              true,
            ),
            isSeasonal: this.convertYesNoToBoolean(data['Seasonal'], false),
            isSeasonalAvailabilityEnabled: this.convertYesNoToBoolean(data['Seasonal'], false),
            isSeasonalPricingEnabled: this.convertYesNoToBoolean(data['Seasonal_Pricing'], false),
            seasonalAvailabilityStartDate: data['Seasonal_Start_Date']
              ? new Date(data['Seasonal_Start_Date'])
              : undefined,
            seasonalAvailabilityEndDate: data['Seasonal_End_Date']
              ? new Date(data['Seasonal_End_Date'])
              : undefined,
            seasonalPrice: data['Seasonal_Price'] || 0,
            isCommisionable: this.convertYesNoToBoolean(data['Commissionable'], false),
            corporateLevel: this.convertYesNoToBoolean(data['Corporate_Level*'], false),
            status: data['Status*'],
            store: data['Store_Code'] || '',
            isValidated: true,
            isConsistent: true,
          });
        }
      });

    this.errorList = errors;
    return validProducts;
  }

  convertYesNoToBoolean(value: string, defaultValue: boolean = false): boolean {
    if (!value) return defaultValue;
    const lowerValue = value.trim().toLowerCase();
    if (lowerValue === 'yes') return true;
    if (lowerValue === 'no') return false;
    return defaultValue;
  }

  validateRow(data: any, rowIndex: number): string {
    const missingFields: string[] = [];
    const rowErrors: string[] = [];

    if (!data['Product_Code*']) {
      missingFields.push('Product_Code*');
    }
    if (!data['Name*']) {
      missingFields.push('Name*');
    }
    if (!data['Description*']) {
      missingFields.push('Description*');
    }
    if (!data['Type*']) {
      missingFields.push('Type*');
    }
    if (!data['Corporate_Level*']) {
      missingFields.push('Corporate_Level*');
    }
    if (!data['Status*']) {
      missingFields.push('Status*');
    }

    if (missingFields.length > 0) {
      rowErrors.push(
        `${missingFields.join(', ')} ${missingFields.length > 1 ? 'are' : 'is'} required`,
      );
    }

    if (data['Corporate_Level*']) {
      const isCorporateLevel = this.convertYesNoToBoolean(data['Corporate_Level*'], false);
      const storeCode = data['Store_Code'];

      if (isCorporateLevel && storeCode) {
        rowErrors.push(this.getLocalizedString('::StoreBlank'));
      }
      if (!isCorporateLevel && !storeCode) {
        rowErrors.push(this.getLocalizedString('::StoreRequired'));
      }
    }

    if (data['Seasonal']) {
      const isSeasonal = this.convertYesNoToBoolean(data['Seasonal'], false);
      const seasonalPricing = this.convertYesNoToBoolean(data['Seasonal_Pricing'], false);
      const seasonalStartDate = convertExcelDate(data['Seasonal_Start_Date']);
      const seasonalEndDate = convertExcelDate(data['Seasonal_End_Date']);
      const startDate = this.parseDate(seasonalStartDate);
      const endDate = this.parseDate(seasonalEndDate);
      const seasonalPrice = data['Seasonal_Price'];

      if (isSeasonal) {
        if (!startDate) {
          rowErrors.push(this.getLocalizedString('::SeasonalStartDateRequired'));
        }

        if (!endDate) {
          rowErrors.push(this.getLocalizedString('::SeasonalEndDateRequired'));
        }
      }
      if (seasonalPricing) {
        if (!seasonalPrice || Number(seasonalPrice) <= 0) {
          rowErrors.push(this.getLocalizedString('::SeasonalPriceRequired'));
        }
      }
    }

    if (rowErrors.length > 0) {
      return `Row ${rowIndex}: ${rowErrors.join('; ')}`;
    }
    return '';
  }

  removeTime(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  parseDate(dateString: string | undefined): Date | null {
    if (!dateString) {
      return null;
    }

    const regex = /^(0\d|1[0-2])\/(0\d|[12]\d|3[01])\/\d{4}$/;
    if (!regex.test(dateString)) {
      return null;
    }

    const [month, day, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day);
  }

  jsonFormatter(data: any[]) {
    const headers = data[0];
    const result: any = [];

    for (let i = 1; i < data.length; i++) {
      const obj: { [key: string]: any } = {};
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = data[i][j] === undefined ? null : data[i][j];
      }
      result.push(obj);
    }
    return result;
  }

  createChunkArray(dataArray: any[], chunkSize: number) {
    const result = [];
    for (let i = 0; i < dataArray.length; i += chunkSize) {
      const chunk = dataArray.slice(i, i + chunkSize);
      result.push(chunk);
    }
    return result;
  }
}
