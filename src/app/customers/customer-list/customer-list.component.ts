import { Component, OnInit, TemplateRef } from '@angular/core';
import { ListService, PagedResultDto } from '@abp/ng.core';
import { CustomerAccountType, CustomerDto, CustomerService } from '@proxy/customers';
import { Confirmation, ConfirmationService, ToasterService } from '@abp/ng.theme.shared';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { EXPORT_CONFIG } from 'src/app/export/export-config';
import { take } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-customer-list',
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.scss',
  providers: [ListService],
})
export class CustomerListComponent implements OnInit {
  customers = { items: [], totalCount: 0 } as PagedResultDto<CustomerDto>;
  columns: string[] = [
    'customerId',
    'customerAccountType',
    'name',
    'address1',
    'phoneNumbers',
    'emails',
    'actions',
  ];
  exportUrl = EXPORT_CONFIG.customerUrl;
  exportFieldList = [
    'customerId',
    'name',
    'address1',
    'address2',
    'country',
    'city',
    'stateProvince',
    'zip',
    'fax',
    'isWholeSale',
    'phone1',
    'phone2',
    'email',
    'status',
    'customerAccountType',
    'acctClassValue',
    'store',
    'termValue',
    'taxExempt',
    'taxCertificate',
    'hasDeliveryCharge',
    'deliveryCharge',
    'discount',
    'invoicePaymentSchedulerValue',
    'lifetimeCreditLimit',
    'accountOpenDateTime',
    'lastStatementDate',
    'lastPurchaseDate',
    'lastPaymentDate',
    'ytdAmount',
    'lytDsalesAmount',
    'ytdPayments',
    'lytdPayments',
    'lifetimeSalesAmount',
    'lifetimePayments',
    'previousMonthBalance',
    'unbilledCharges',
    'billedCharges',
    'mtdPayments',
    'mtdCredits',
    'totalDue',
    'balance30Days',
    'balance60Days',
    'balance90Days',
    'balance120Days',
    'balanceOver120Days',
    'unappliedAmount',
  ];

  displayFieldNames = [
    'CUSTOMERID',
    'NAME',
    'ADDRESS1',
    'ADDRESS2',
    'COUNTRY',
    'CITY',
    'STATE_PROVINCE',
    'ZIP',
    'FAX',
    'WHOLESALE',
    'PHONE1',
    'PHONE2',
    'EMAIL',
    'STATUS',
    'TYPE',
    'ACCT_CLASS',
    'STORE_ID',
    'TERMS',
    'IS_TAX_EXEMPT',
    'TAX_EXEMPT_NUMBER',
    'IS_DELIVERY_CHARGE',
    'DELIVERY_CHARGE',
    'DISCOUNT',
    'INVOICE_PAYMENT_SCHEDULE',
    'CREDIT_LIMIT',
    'ACCOUNT_OPEN_DATE',
    'LAST_STATEMENT_DATE',
    'LAST_PURCHASE_DATE',
    'LAST_PAYMENT_DATE',
    'YTD_SALES',
    'LYTD_SALES',
    'YTD_PAYMENTS',
    'LYTD_PAYMENTS',
    'LIFETIME_SALES',
    'LIFETIME_PAYMENTS',
    'PREVIOUS_MONTH_BALANCE',
    'UNBILLED_CHARGES',
    'BILLED_CHARGES',
    'MTD_PAYMENTS',
    'MTD_CREDITS',
    'TOTAL_DUE',
    '30DAY_BALANCE',
    '60DAY_BALANCE',
    '90DAY_BALANCE',
    '120DAY_BALANCE',
    'OVER120DAY_BALANCE',
    'UNAPPLIED_AMOUNT',
  ];
  filter: string = '';
  protected readonly CustomerAccountType = CustomerAccountType;
  showDiv: boolean = true;
  errorList: string[] = [];
  errorReportUrl: string | null = null;
  numberOfImportedCustomers: number = 0;
  numberOfFailedImports: number = 0;
  showProgressbar: boolean = false;

  private readonly downloadFileLocation = 'assets/templates/Customer_Import_Template.xlsx';
  private readonly downloadImportFileName = 'Customer_Import_Template.xlsx';

  constructor(
    public readonly list: ListService,
    private customerService: CustomerService,
    private confirmation: ConfirmationService,
    private toasterService: ToasterService,
    public dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  delete(id: string) {
    this.confirmation.warn('::AreYouSureToDelete', '::AreYouSure').subscribe(status => {
      if (status === Confirmation.Status.confirm) {
        this.customerService.delete(id).subscribe(() => {
          this.loadCustomers();
          this.toasterService.success('::Customer:DeletedSuccessfully');
        });
      }
    });
  }

  changePage(pageEvent: PageEvent) {
    this.list.page = pageEvent.pageIndex;
    this.loadCustomers();
  }

  changeSort(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
    this.loadCustomers();
  }

  onSearch(filter: string) {
    this.filter = filter;
    this.list.page = 0;
    this.loadCustomers();
  }

  onImportingProcessStarted(isStarted: boolean) {
    this.showProgressbar = isStarted;
  }

  onCustomerImportDone(isDone: boolean) {
    this.showProgressbar = !isDone;
    this.showDiv = !isDone;

    if (this.errorList.length > 0) {
      this.generateErrorReport(this.errorList);
    } else {
      this.errorReportUrl = null;
    }
  }

  openImportCustomerDialog(templateRef: TemplateRef<any>) {
    const dialogRef = this.dialog.open(templateRef, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe(() => {
      this.resetDialogState();
      this.refreshCustomerList();
    });
  }

  private refreshCustomerList(): void {
    this.loadCustomers();
  }

  private resetDialogState(): void {
    this.showDiv = true;
    this.errorList = [];
    this.numberOfImportedCustomers = 0;
    this.errorReportUrl = null;
  }

  updateCustomerImportResponse(response: any) {
    this.numberOfImportedCustomers += response.importedCustomers;
    this.numberOfFailedImports += response.failedImports;

    if (response.errors && response.errors.length > 0) {
      this.errorList = response.errors;
    } else {
      this.errorList = [];
    }
  }

  generateErrorReport(errorList: string[]): void {
    let errorHtml = `
      <html>
        <head>
          <title>Import Error Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              background-color: #f9f9f9;
            }
            h3 {
              color: #d9534f;
              border-bottom: 2px solid #d9534f;
              padding-bottom: 10px;
            }
            ul {
              list-style-type: none;
              padding: 0;
              margin: 0;
            }
            li {
              margin-bottom: 10px;
            }
            .row-header {
              font-weight: bold;
              margin-top: 15px;
              color: #0275d8;
              font-size: 1.2em;
            }
            .error-item {
              margin-left: 20px;
              color: #d9534f;
              font-style: italic;
              margin-top: 5px;
            }
            .container {
              background-color: white;
              padding: 20px;
              border-radius: 5px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .row-container {
              border-left: 4px solid #0275d8;
              padding-left: 10px;
              margin-bottom: 15px;
            }
            .error-container {
              border-left: 4px solid #d9534f;
              padding-left: 10px;
              margin-top: 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h3>Import Errors:</h3>
            <ul>
    `;
    const formattedErrors = this.formatErrors(errorList);
    errorHtml += `
              ${formattedErrors}
            </ul>
          </div>
        </body>
      </html>
    `;
    const blob = new Blob([errorHtml], { type: 'text/html' });
    this.errorReportUrl = window.URL.createObjectURL(blob);
  }

  formatErrors(errorList: string[]): string {
    const rowErrorMap: { [key: string]: string[] } = {};

    errorList.forEach((error: string) => {
      const match = RegExp(/Row \d+:/).exec(error);
      const row = match ? match[0] : 'Unknown Row';

      const cleanedError = error.replace(row, '').trim();
      const splitErrors = cleanedError.split(';').map(e => e.trim());

      if (!rowErrorMap[row]) {
        rowErrorMap[row] = [];
      }
      rowErrorMap[row].push(...splitErrors);
    });

    return Object.keys(rowErrorMap)
      .map(row => {
        const errors = rowErrorMap[row]
          .map(err => `<div class="error-container"><li class="error-item">${err}</li></div>`)
          .join('');
        return `<div class="row-container"><li class="row-header">${row}</li><ul>${errors}</ul></div>`;
      })
      .join('');
  }

  downloadTemplate(): void {
    const link = document.createElement('a');
    link.href = this.downloadFileLocation;
    link.download = this.downloadImportFileName;
    link.click();
  }

  private loadCustomers() {
    this.list
      .hookToQuery(query =>
        this.customerService.getList({
          ...query,
          filter: this.filter,
        }),
      )
      .pipe(take(1))
      .subscribe(response => {
        this.customers = response;
      });
  }
}
