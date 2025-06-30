import { ListService, PagedResultDto } from '@abp/ng.core';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { PaymentTransactionCodeService } from '@proxy/payment-transaction-codes';
import { FilterPagedAndSortedResultRequestDto } from '@proxy/shared';
import { Subject, take, takeUntil } from 'rxjs';
import { TransactionTypeCodeItem } from './transaction-type-settings.models';
import { CreateUpdateTransactionTypeDialogComponent } from './create-update-transaction-type-dialog/create-update-transaction-type-dialog.component';
import { paymentTransactionCodeCategoryOptions } from '@proxy/transactions/payment-transaction-code-category.enum';
import { sortEnumValues } from '../shared/common-utils';

@Component({
  selector: 'app-transaction-type-settings',
  templateUrl: './transaction-type-settings.component.html',
  styleUrls: ['./transaction-type-settings.component.scss'],
  providers: [ListService],
})
export class TransactionTypeSettingsComponent implements OnInit, OnDestroy {
  transactionCodePaginatedResult = {
    items: [],
    totalCount: 0,
  } as PagedResultDto<TransactionTypeCodeItem>;

  columns: string[] = [
    'transactionCode',
    'title',
    'paymentTransactionCodeCategory',
    'isActive',
    'actions',
  ];
  filter: string = '';
  destroy$: Subject<void> = new Subject();
  paymentTransactionCodeCategoryOptions = sortEnumValues(paymentTransactionCodeCategoryOptions);

  constructor(
    public readonly list: ListService,
    private readonly paymentTransactionCodeService: PaymentTransactionCodeService,
    public dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.getAllPaymentTransactionCodes();
  }

  createPaymentTransactionCode() {
    const dialogRef = this.dialog.open(CreateUpdateTransactionTypeDialogComponent, {
      width: '50%',
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result?.success) {
          this.getAllPaymentTransactionCodes();
        }
      });
  }

  changeSort(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
    this.getAllPaymentTransactionCodes();
  }

  changePage(event: PageEvent) {
    this.list.page = event.pageIndex;
    this.getAllPaymentTransactionCodes();
  }

  getAllPaymentTransactionCodes() {
    const discountStreamCreator = (query: FilterPagedAndSortedResultRequestDto) =>
      this.paymentTransactionCodeService.getList({ ...query, filter: this.filter });

    this.list
      .hookToQuery(discountStreamCreator)
      .pipe(takeUntil(this.destroy$), take(1))
      .subscribe(response => {
        this.transactionCodePaginatedResult = {
          totalCount: response.totalCount,
          items: response.items.map(x => {
            return {
              ...x,
              paymentTransactionCodeCategoryDisplayName: this.getObjectKeyByValue(
                paymentTransactionCodeCategoryOptions,
                x.paymentTransactionCodeCategory,
              ),
            };
          }),
        };
      });
  }

  search(filter: string) {
    this.filter = filter;
    this.list.page = 0;
    this.getAllPaymentTransactionCodes();
  }

  editPaymentTransactionCode(transactionCodeId: string) {
    const dialogRef = this.dialog.open(CreateUpdateTransactionTypeDialogComponent, {
      width: '50%',
      data: { transactionCodeId: transactionCodeId },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result?.success) {
          this.getAllPaymentTransactionCodes();
        }
      });
  }

  getObjectKeyByValue(data: Array<{ key: string; value: number }>, value: number): string {
    return data.find(item => item.value === value)?.key;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
