import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BatchDetailDto } from '@proxy/batch-payments';
import { Subject } from 'rxjs';
import { BatchAccountListItem } from '../../account-receivable.models';
import { PaymentTransactionCodeCategory } from '@proxy/transactions';

@Component({
  selector: 'app-batch-payment-processing-dialog',
  templateUrl: './batch-payment-processing-dialog.component.html',
  styleUrls: ['./batch-payment-processing-dialog.component.scss'],
})
export class BatchPaymentProcessingDialogComponent implements OnInit, OnDestroy {
  destroy$: Subject<void> = new Subject();
  batchDetailDto: BatchDetailDto;
  batchAccountListItem: BatchAccountListItem;

  openCheckPaymentForm: boolean = false;
  openCardPaymentForm: boolean = false;

  constructor(@Inject(MAT_DIALOG_DATA) private data: any) {
    this.batchDetailDto = data?.batchDetailDto;
    this.batchAccountListItem = data?.batchAccountListItem;
    this.openCheckPaymentForm =
      data?.paymentTransactionCodeCategory === PaymentTransactionCodeCategory.PaymentByCheck;
    this.openCardPaymentForm =
      data?.paymentTransactionCodeCategory === PaymentTransactionCodeCategory.PaymentByCC;
  }

  ngOnInit() {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
