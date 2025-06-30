import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PosCustomerListComponent } from '../pos-customer-list/pos-customer-list.component';
import { CustomerDto, CustomerService } from '@proxy/customers';
import { AbpLocalStorageService } from '@abp/ng.core';
import { AddCustomerPopupComponent } from '../add-customer-popup/add-customer-popup.component';
import { SharedDataService } from '../shared-data.service';
import { OrderSummary } from '../models/order-summary.model';
import { OrderType } from '@proxy/orders';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-pos-customer',
  templateUrl: './pos-customer.component.html',
  styleUrl: './pos-customer.component.scss',
})
export class PosCustomerComponent implements OnInit, OnDestroy {
  showFormField: boolean = true;
  customerAdded: boolean = false;
  customer: CustomerDto;
  stateProvince: string;
  country: string;
  selectedCustomer: CustomerDto;
  email: string;
  phoneNumber: string;
  searchText: string;
  orderSummary: OrderSummary;
  orderType = OrderType;
  destroy$: Subject<void> = new Subject();

  constructor(
    public dialog: MatDialog,
    private localStorageService: AbpLocalStorageService,
    private sharedDataService: SharedDataService,
    private customerService: CustomerService,
  ) {}

  ngOnInit(): void {
    this.populateCustomer();
    this.subscribeToOrderSummary();
    this.subscribeToPaymentCompletionNotification();
    this.subscribeToReOrderPlacementNotification();
  }

  subscribeToOrderSummary() {
    this.sharedDataService.orderSummary.pipe(takeUntil(this.destroy$)).subscribe(orderSummary => {
      this.orderSummary = orderSummary;
      if (this.orderSummary?.orderType === this.orderType.PU) {
        this.selectedCustomer = null;
        this.resetCustomerSelection();
      }
    });
  }

  subscribeToPaymentCompletionNotification() {
    this.sharedDataService.paymentMade$.pipe(takeUntil(this.destroy$)).subscribe(x => {
      if (x) this.deleteCustomer();
    });
  }

  subscribeToReOrderPlacementNotification() {
    this.sharedDataService.reOrderPlaced$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (x: boolean) => {
        if (x && this.orderSummary.customerId) {
          this.customerService.get(this.orderSummary.customerId).subscribe({
            next: (customer: CustomerDto) => {
              this.localStorageService.setItem('customer', JSON.stringify(customer));
              this.sharedDataService.addCustomer(customer);
              this.populateCustomer();
            },
          });
        }
      },
    });
  }

  showCustomerList(): void {
    if (this.orderSummary?.orderType === OrderType.PU) return;

    const dialogRef = this.dialog.open(PosCustomerListComponent, {
      width: '1000px',
      data: {
        searchText: this.searchText,
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.searchText = null;
        if (result !== 'added') return;
        this.customerAdded = dialogRef.componentInstance.customerAdded;
        this.populateCustomer();
      });
  }

  public deleteCustomer(): void {
    this.resetCustomerSelection();
    this.sharedDataService.deleteCustomer();
    this.populateCustomer();
    this.sharedDataService.shareOrderSummary(this.orderSummary);
  }

  populateCustomer() {
    this.selectedCustomer = JSON.parse(this.localStorageService.getItem('customer')) as CustomerDto;
    if (this.selectedCustomer) {
      this.showFormField = false;
      this.phoneNumber = this.selectedCustomer.phoneDirectories.find(x => x.isPrimary)?.phoneNumber;
      this.email = this.selectedCustomer.emailDirectories[0]?.email;
    }
    this.sharedDataService.addCustomer(this.selectedCustomer);
  }

  editCustomer() {
    const dialogRef = this.dialog.open(AddCustomerPopupComponent, {
      width: '1200px',
      data: { customerId: this.selectedCustomer?.id },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((response: string) => {
        if (response === 'added') this.populateCustomer();
      });
  }

  private resetCustomerSelection() {
    this.customer = null;
    this.localStorageService.removeItem('customer');
    this.customerAdded = false;
    this.showFormField = true;
    this.sharedDataService.resetInvoiceTypeOrderSelection();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
