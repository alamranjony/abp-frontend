import { Component, ViewChild, ElementRef, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PosCustomerDetailsComponent } from '../pos-customer-details/pos-customer-details.component';
import { CustomerDto, CustomerService, GetCustomerListDto } from '@proxy/customers';
import { ListService, PagedResultDto } from '@abp/ng.core';
import { AddCustomerPopupComponent } from '../add-customer-popup/add-customer-popup.component';
import { SharedDataService } from '../shared-data.service';
import { OrderSummary } from '../models/order-summary.model';
import { Subject, takeUntil } from 'rxjs';
import { OrderType } from '@proxy/orders';

@Component({
  selector: 'app-pos-customer-list',
  templateUrl: './pos-customer-list.component.html',
  styleUrl: './pos-customer-list.component.scss',
  providers: [ListService],
})
export class PosCustomerListComponent implements OnInit, OnDestroy {
  @ViewChild('autoFocusInput') autoFocusInput!: ElementRef;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns: string[] = ['name', 'customerId', 'phone', 'address1', 'zip', 'select'];
  dataSource: MatTableDataSource<CustomerDto>;
  customerPaginatedResult = { items: [], totalCount: 0 } as PagedResultDto<CustomerDto>;
  filter: string = '';
  customerAdded: boolean = false;
  selectedCustomer: CustomerDto;
  orderSummary: OrderSummary;
  destroy$: Subject<void> = new Subject();
  orderType = OrderType;

  constructor(
    public dialog: MatDialog,
    public readonly list: ListService,
    private customerService: CustomerService,
    public dialogRef: MatDialogRef<PosCustomerListComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private sharedDataService: SharedDataService,
  ) {
    this.filter = data.searchText ?? '';
  }

  ngOnInit(): void {
    this.sharedDataService.orderSummary.pipe(takeUntil(this.destroy$)).subscribe(orderSummary => {
      this.orderSummary = orderSummary;
    });

    this.getAllCustomers();
    this.search(this.filter);
  }

  changeSort(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
  }

  changePage(event: PageEvent) {
    this.list.page = event.pageIndex;
  }

  private getAllCustomers() {
    const customerStreamCreator = (query: GetCustomerListDto) =>
      this.customerService.getList({
        ...query,
        filter: this.filter,
        orderType: this.orderSummary?.orderType,
      });

    this.list
      .hookToQuery(customerStreamCreator)
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.customerPaginatedResult = response;
      });
  }

  search(filter: string) {
    this.filter = filter;
    this.customerService
      .getList({
        filter: this.filter,
        orderType: this.orderSummary?.orderType,
      } as GetCustomerListDto)
      .subscribe(response => {
        this.customerPaginatedResult = response;
      });
  }

  showCustomerDetails(customer: CustomerDto): void {
    this.customerService.get(customer.id).subscribe(customerData => {
      if (customerData) {
        const dialogRef = this.dialog.open(PosCustomerDetailsComponent, {
          width: '1000px',
          data: customerData, // Pass the selected customer data
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result === 'added') {
            this.customerAdded = true;
            this.selectedCustomer = customerData;
            if (this.selectedCustomer.isWholeSale) {
              this.sharedDataService.updateOrderType(OrderType.IV);
            }
            this.dialogRef.close('added');
          }
        });
      }
    });
  }

  close() {
    this.dialogRef.close('close');
  }

  showAddCustomerPopUp(): void {
    if (
      this.orderSummary?.orderType === OrderType.PO ||
      this.orderSummary?.orderType === OrderType.DO
    )
      return;

    const dialogRef = this.dialog.open(AddCustomerPopupComponent, {
      width: '1000px',
    });

    dialogRef.afterClosed().subscribe((response: string) => {
      if (response === 'added') this.dialogRef.close('added');
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
