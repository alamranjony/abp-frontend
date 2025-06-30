import { PagedResultDto, ListService } from '@abp/ng.core';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { CustomerDto, CustomerService } from '@proxy/customers';
import {
  PaymentMasterWithDetailsDto,
  GetPaymentMasterListDto,
  PaymentMasterService,
} from '@proxy/pospayment';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-individual-payment-list',
  templateUrl: './individual-payment-list.component.html',
  styleUrl: './individual-payment-list.component.scss',
  providers: [ListService],
})
export class IndividualPaymentListComponent implements OnInit, OnDestroy {
  payments = { items: [], totalCount: 0 } as PagedResultDto<PaymentMasterWithDetailsDto>;
  filter: string = '';
  columns: string[] = [
    'transactionDate',
    'customerName',
    'invoiceNo',
    'paymentTypeId',
    'amount',
    'note',
    'actions',
  ];
  customers: CustomerDto[] = [];
  selectedCustomerId: string;

  destroy$: Subject<void> = new Subject();

  constructor(
    public readonly list: ListService<GetPaymentMasterListDto>,
    private paymentMasterService: PaymentMasterService,
    private customerService: CustomerService,
  ) {}

  ngOnInit(): void {
    this.getCustomers();
    this.loadSinglePayments();
  }

  getCustomers() {
    this.customerService
      .getHouseAccountCustomers()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        res => {
          this.customers = res;
        },
        () => {
          this.customers = [];
        },
      );
  }

  onCustomerSelectionChanges(selectedCustomerId) {
    this.selectedCustomerId = selectedCustomerId;
    this.list.page = 0;
    this.loadSinglePayments();
  }

  onSearch(filter: string): void {
    this.filter = filter;
    this.list.page = 0;
    this.loadSinglePayments();
  }

  changePage(pageEvent: PageEvent) {
    this.list.page = pageEvent.pageIndex;
    this.loadSinglePayments();
  }

  changeSort(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
    this.loadSinglePayments();
  }

  private loadSinglePayments() {
    this.list
      .hookToQuery(query =>
        this.paymentMasterService.getList({
          ...query,
          filter: this.filter,
          customerId: this.selectedCustomerId,
        }),
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.payments = response;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
