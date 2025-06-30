import { ToasterService } from '@abp/ng.theme.shared';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CustomerService, ImportCustomerDto } from '@proxy/customers';
import { convertExcelDate } from 'src/app/shared/date-time-utils';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-import-customer-data',
  templateUrl: './import-customer-data.component.html',
  styleUrl: './import-customer-data.component.scss',
})
export class ImportCustomerDataComponent {
  @Input() apiUrl: string;
  @Input() fileName: string;
  @Input() queryParams: Record<string, any> = {};
  @Input() fieldList?: string[];
  @Output() isCustomerDataImportDone = new EventEmitter<boolean>();
  @Output() hasImportProcessStarted = new EventEmitter<boolean>();
  @Output() importedDataResponse = new EventEmitter<any>();

  customerData: { [key: string]: any }[] = [];
  numberOfCustomersImported: number = 0;
  numberOfFailedImports: number = 0;
  importProgress: number = 0;
  errorList: string[] = [];
  isUploading: boolean = false;

  constructor(
    private readonly customerService: CustomerService,
    private readonly toaster: ToasterService,
  ) {}

  onFileChange(evt: any) {
    const target: DataTransfer = <DataTransfer>evt.target;
    if (target.files.length !== 1) {
      this.toaster.error('::ErrorCustomerUpload');
      return;
    }

    const file = target.files[0];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    if (!['xlsx', 'xls'].includes(fileExtension)) {
      this.toaster.error('::ImportFileFormatError');
      return;
    }

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const wb: XLSX.WorkBook = XLSX.read(e.target.result, { type: 'binary' });
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
      this.customerData = this.jsonFormatter(data);
    };
    reader.readAsArrayBuffer(file);
  }

  importCustomers() {
    if (!this.customerData.length) {
      this.toaster.error('::NoDataToImport');
      return;
    }

    const listOfCustomers = this.mapJsonToCustomerDto(this.customerData);
    if (!listOfCustomers.length) {
      this.toaster.error('::NoValidCustomer');
      this.importedDataResponse.emit({
        importedCustomers: 0,
        failedImports: this.customerData.length,
        errors: this.errorList.length ? this.errorList : ['No valid customers to import.'],
      });

      setTimeout(() => this.isCustomerDataImportDone.emit(true), 1000);
      return;
    }

    this.processImport(listOfCustomers);
  }

  private async processImport(listOfCustomers: any[]) {
    const chunkedProductData = this.createChunkArray(listOfCustomers, 100);
    const totalBatches = chunkedProductData.length;

    this.importProgress = 0;
    this.hasImportProcessStarted.emit(true);
    this.isUploading = true;

    const importPromises = chunkedProductData.map((chunk, index) => {
      return new Promise<void>((resolve, reject) => {
        this.customerService.batchCustomerImport(chunk).subscribe(
          (response: any) => {
            this.numberOfCustomersImported += response.processedCustomers;
            this.numberOfFailedImports += response.failedImport;

            if (response.failedCustomerList && response.failedCustomerList.length > 0) {
              const backendErrors = response.failedCustomerList.map((customer: any) => {
                return `Customer ${customer.name}: ${customer.errorMessages.join(', ')}`;
              });
              this.errorList = [...this.errorList, ...backendErrors];
            }

            this.importProgress = ((index + 1) / totalBatches) * 100;
            resolve();
          },
          (error: any) => {
            this.toaster.error('::ErrorCustomerUpload');
            reject(new Error(error));
          },
        );
      });
    });

    Promise.all(importPromises.map(promise => promise.catch(error => {})))
      .then(() => {
        this.importedDataResponse.emit({
          importedCustomers: this.numberOfCustomersImported,
          failedImports: this.numberOfFailedImports,
          errors: this.errorList,
        });

        setTimeout(() => {
          this.isCustomerDataImportDone.emit(true);
          this.isUploading = false;
        }, 5000);
      })
      .catch(error => {
        this.toaster.error('::ErrorCustomerUpload');
        this.isUploading = false;
      });
  }

  mapJsonToCustomerDto(jsonData: any[]): ImportCustomerDto[] {
    const errors: string[] = [];
    const validCustomers: ImportCustomerDto[] = [];

    jsonData.forEach((data, index) => {
      if (this.isRowEmpty(data)) return;

      const requiredFields = [
        'CUSTOMERID*',
        'NAME*',
        'ADDRESS1*',
        'CITY*',
        'STATE_PROVINCE*',
        'ZIP*',
        'PHONE1*',
        'STATUS*',
        'ACCT_CLASS*',
        'STORE_ID*',
        'IS_TAX_EXEMPT*',
        'INVOICE_PAYMENT_SCHEDULE*',
      ];

      const missingFields = requiredFields.filter(field => !data[field]?.toString().trim());
      if (missingFields.length) {
        errors.push(`Row ${index + 2}: Missing fields - ${missingFields.join(', ')}`);
        return;
      }

      const customer: ImportCustomerDto = {
        customerId: data['CUSTOMERID*']?.toString() || '',
        name: data['NAME*']?.trim(),
        address1: data['ADDRESS1*']?.trim(),
        address2: data['ADDRESS2']?.trim() || '',
        city: data['CITY*']?.trim(),
        stateProvince: data['STATE_PROVINCE*']?.trim(),
        zip: data['ZIP*']?.toString().trim(),
        country: data['COUNTRY']?.trim() || '',
        wholesale: this.convertYesNoToBoolean(data['WHOLESALE']),
        phone1: data['PHONE1*'],
        phone2: data['PHONE2']?.trim() || '',
        email: data['EMAIL']?.trim() || '',
        statusValue: data['STATUS*']?.trim(),
        acctType: data['TYPE*']?.trim() || '',
        acctClassValue: data['ACCT_CLASS*']?.trim(),
        storeId: data['STORE_ID*']?.trim(),
        termValueId: data['TERMS']?.trim() || '',
        taxExempt: this.convertYesNoToBoolean(data['IS_TAX_EXEMPT*']),
        taxCertificate: data['TAX_EXEMPT_NUMBER'] || '',
        hasDeliveryCharge: this.convertYesNoToBoolean(data['IS_DELIVERY_CHARGE']),
        deliveryCharge: parseFloat(data['DELIVERY_CHARGE']) || 0,
        discount: parseFloat(data['DISCOUNT']) || 0,
        lifetimeCreditLimit: parseFloat(data['CREDIT_LIMIT']) || 0,
        accountOpenDateTime: data['ACCOUNT_OPEN_DATE']
          ? convertExcelDate(data['ACCOUNT_OPEN_DATE'])
          : undefined,
        lastStatementDate: data['LAST_STATEMENT_DATE']
          ? convertExcelDate(data['LAST_STATEMENT_DATE'])
          : undefined,
        lastPurchaseDate: data['LAST_PURCHASE_DATE']
          ? convertExcelDate(data['LAST_PURCHASE_DATE'])
          : undefined,
        lastPaymentDate: data['LAST_PAYMENT_DATE']
          ? convertExcelDate(data['LAST_PAYMENT_DATE'])
          : undefined,
        ytdSalesAmount: parseFloat(data['YTD_SALES']) || 0,
        lytDsalesAmount: parseFloat(data['LYTD_SALES']) || 0,
        ytdPayments: parseFloat(data['YTD_PAYMENTS']) || 0,
        lytdPayments: parseFloat(data['LYTD_PAYMENTS']) || 0,
        lifetimeSalesAmount: parseFloat(data['LIFETIME_SALES']) || 0,
        lifetimePayments: parseFloat(data['LIFETIME_PAYMENTS']) || 0,
        previousMonthBalance: parseFloat(data['PREVIOUS_MONTH_BALANCE']) || 0,
        unbilledCharges: parseFloat(data['UNBILLED_CHARGES']) || 0,
        billedCharges: parseFloat(data['BILLED_CHARGES']) || 0,
        mtdPayments: parseFloat(data['MTD_PAYMENTS']) || 0,
        mtdCredits: parseFloat(data['MTD_CREDITS']) || 0,
        totalDue: parseFloat(data['TOTAL_DUE']) || 0,
        balance30Days: parseFloat(data['30DAY_BALANCE']) || 0,
        balance60Days: parseFloat(data['60DAY_BALANCE']) || 0,
        balance90Days: parseFloat(data['90DAY_BALANCE']) || 0,
        balance120Days: parseFloat(data['120DAY_BALANCE']) || 0,
        balanceOver120Days: parseFloat(data['OVER120DAY_BALANCE']) || 0,
        unappliedAmount: parseFloat(data['UNAPPLIED_AMOUNT']) || 0,
        invoicePaymentSchedulerValue: data['INVOICE_PAYMENT_SCHEDULE*']?.trim() || '',
        fax: data['FAX']?.trim() || '',
        isValidated: false,
        isConsistent: true,
        errorMessages: [],
      };

      validCustomers.push(customer);
    });

    this.errorList = errors;
    return validCustomers;
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
    return Array.from({ length: Math.ceil(dataArray.length / chunkSize) }, (_, i) =>
      dataArray.slice(i * chunkSize, i * chunkSize + chunkSize),
    );
  }

  convertYesNoToBoolean(value: string): boolean {
    return value?.trim().toLowerCase() === 'yes';
  }

  isRowEmpty(data: any): boolean {
    return !Object.values(data).some(value => value !== null && value !== '');
  }
}
