import { Component, OnInit, TemplateRef } from '@angular/core';
import { ListService, PagedResultDto } from '@abp/ng.core';
import { ProductService, ProductDto } from '@proxy/products';
import { ConfirmationService, Confirmation } from '@abp/ng.theme.shared';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { ProductCsvExportService } from 'src/app/services/product-csv-export';
import { take } from 'rxjs';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  providers: [ListService],
})
export class ProductListComponent implements OnInit {
  products: PagedResultDto<ProductDto> = { items: [], totalCount: 0 } as PagedResultDto<ProductDto>;
  columns: string[] = [
    'productCode',
    'name',
    'sku',
    'description',
    'productType',
    'department',
    'basePrice',
    'statusName',
    'onHandQuantity',
    'storeName',
    'actions',
  ];
  searchParam: string = '';
  showProgressbar: boolean = false;
  showDiv: boolean = true;
  numberOfImportedProducts: number = 0;
  numberOfFailedImports: number = 0;
  errorList: string[] = [];
  errorReportUrl: string | null = null;

  constructor(
    public readonly list: ListService,
    private productService: ProductService,
    private confirmation: ConfirmationService,
    public dialog: MatDialog,
    private readonly productCsvExportService: ProductCsvExportService,
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  onImportingProcessStarted(isStarted: boolean) {
    this.showProgressbar = isStarted;
  }

  onProductImportDone(isDone: boolean) {
    this.showProgressbar = !isDone;
    this.showDiv = !isDone;

    if (this.errorList.length > 0) {
      this.generateErrorReport(this.errorList);
    } else {
      this.errorReportUrl = null;
    }
  }

  openImportProductDialog(templateRef: TemplateRef<any>) {
    const dialogRef = this.dialog.open(templateRef, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe(() => {
      this.resetDialogState();
      this.refreshProductList();
    });
  }

  private refreshProductList(): void {
    this.loadProducts();
  }

  private resetDialogState(): void {
    this.showDiv = true;
    this.errorList = [];
    this.numberOfImportedProducts = 0;
    this.errorReportUrl = null;
  }

  updateProductImportResponse(response: any) {
    this.numberOfImportedProducts += response.importedProducts;
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

  onSearch(filter: string) {
    this.searchParam = filter;
    this.list.page = 0;
    this.loadProducts();
  }

  exportProduct() {
    this.productCsvExportService.exportProductsCsv();
  }

  downloadTemplate(): void {
    const link = document.createElement('a');
    link.href = 'assets/templates/ProductImportTemplate.xlsx';
    link.download = 'product-import-template.xlsx';
    link.click();
  }

  delete(id: string) {
    this.confirmation.warn('::AreYouSureToDelete', '::AreYouSure').subscribe(status => {
      if (status === Confirmation.Status.confirm) {
        this.productService.delete(id).subscribe(() => this.loadProducts());
      }
    });
  }

  changePage(pageEvent: PageEvent) {
    this.list.page = pageEvent.pageIndex;
    this.loadProducts();
  }

  changeSort(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
    this.loadProducts();
  }

  private loadProducts() {
    this.list
      .hookToQuery(query =>
        this.productService.getList({
          ...query,
          filter: this.searchParam,
        }),
      )
      .pipe(take(1))
      .subscribe(response => {
        this.products = response;
      });
  }
}
