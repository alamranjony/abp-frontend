import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { FinancialTransactionDto, FinancialTransactionService } from '@proxy/transactions';
import { take } from 'rxjs';
import { Sort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';
import { ListService, PagedResultDto } from '@abp/ng.core';
import { ActivatedRoute } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';

@Component({
  selector: 'app-customer-invoice-list',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './customer-invoice-list.component.html',
  styleUrl: './customer-invoice-list.component.scss',
})
export class CustomerInvoiceListComponent implements OnInit {
  @Input() customerId: string;
  transactions = { items: [], totalCount: 0 } as PagedResultDto<FinancialTransactionDto>;
  readonly columns: string[] = [
    'transactionType',
    'orderDate',
    'referenceNumber',
    'orderNumber',
    'totalAmount',
    'paidAmount',
    'netAmount',
    'note',
  ];

  constructor(
    readonly list: ListService,
    private readonly financialTransactionService: FinancialTransactionService,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.customerId = params.get('id');
      if (this.customerId) {
        this.loadTransactions();
      }
    });
  }

  changeSort(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
    this.loadTransactions();
  }

  changePage(event: PageEvent) {
    this.list.page = event.pageIndex;
    this.loadTransactions();
  }

  private loadTransactions(): void {
    this.list
      .hookToQuery(query =>
        this.financialTransactionService.getListByCustomerId(this.customerId, query),
      )
      .pipe(take(1))
      .subscribe(response => {
        this.transactions = response;
      });
  }
}
