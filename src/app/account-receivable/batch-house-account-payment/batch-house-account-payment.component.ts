import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { BatchAccountDto, BatchDetailDto, BatchDetailService } from '@proxy/batch-payments';
import {
  PaymentTransactionCodeDto,
  PaymentTransactionCodeService,
} from '@proxy/payment-transaction-codes';
import { StoreLookupDto, StoreService } from '@proxy/stores';
import { catchError, Subject, takeUntil, throwError } from 'rxjs';
import { BatchPaymentProcessingDialogComponent } from './batch-payment-processing-dialog/batch-payment-processing-dialog.component';
import { BatchPaymentSharedDataService } from './batch-payment-shared-data.service';
import { ToasterService } from '@abp/ng.theme.shared';
import { BatchAccountListItem } from '../account-receivable.models';
import {
  PaymentTransactionCodeCategory,
  paymentTransactionCodeCategoryOptions,
} from '@proxy/transactions';

@Component({
  selector: 'app-batch-house-account-payment',
  templateUrl: './batch-house-account-payment.component.html',
  styleUrls: ['./batch-house-account-payment.component.scss'],
})
export class BatchHouseAccountPaymentComponent implements OnInit, OnDestroy {
  batchHouseAccountPaymentForm: FormGroup;
  stores: StoreLookupDto[] = [];

  destroy$ = new Subject<void>();
  transactionTypeCodes: PaymentTransactionCodeDto[] = [];
  batchDetailDto: BatchDetailDto;
  batchAccounts: BatchAccountListItem[] = [];

  columns: string[] = [
    'accountNo',
    'accountName',
    'transactionType',
    'code',
    'date',
    'amount',
    'actions',
  ];

  readonly checkProcessingBatchTableColumns: string[] = [
    'accountNo',
    'accountName',
    'transactionType',
    'code',
    'date',
    'amount',
    'checkNo',
    'actions',
  ];

  readonly cardProcessingBatchTableColumns: string[] = [
    'accountNo',
    'accountName',
    'transactionType',
    'code',
    'date',
    'amount',
    'actions',
  ];

  constructor(
    private fb: FormBuilder,
    private storeService: StoreService,
    private paymentTransactionCodeService: PaymentTransactionCodeService,
    private batchDetailService: BatchDetailService,
    public dialog: MatDialog,
    private batchPaymentSharedDataService: BatchPaymentSharedDataService,
    private toasterService: ToasterService,
  ) {}

  ngOnInit() {
    this.buildForm();
    this.getStores();
    this.getTransactionTypeCodes();
  }

  buildForm() {
    this.batchHouseAccountPaymentForm = this.fb.group({
      batchNo: ['', Validators.required],
      batchTotalAmount: [0, Validators.required],
      transactionDate: [new Date(), Validators.required],
      paymentTransactionCodeId: ['', Validators.required],
      storeId: ['', Validators.required],
      fulfilledAmount: [{ value: 0, disabled: true }, Validators.required],
      dueAmount: [{ value: 0, disabled: true }, Validators.required],
    });
    this.listenToBatchTotalAmountChanges();
  }

  listenToBatchTotalAmountChanges() {
    this.batchHouseAccountPaymentForm
      .get('batchTotalAmount')
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(batchTotalAmount => {
        const fulfilledAmount = this.batchHouseAccountPaymentForm.get('fulfilledAmount').value;
        const dueAmount = this.batchPaymentSharedDataService.toFixed(
          batchTotalAmount - fulfilledAmount,
        );
        this.batchHouseAccountPaymentForm.patchValue({ dueAmount: dueAmount });
      });
  }

  createBatch() {
    if (this.batchHouseAccountPaymentForm.invalid) {
      this.batchHouseAccountPaymentForm.markAllAsTouched();
      this.toasterService.error('::ValidationError:InvalidFormOrData');
      return;
    }
    
    this.batchDetailService
      .create(this.batchHouseAccountPaymentForm.getRawValue())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.batchDetailDto = response;
          this.batchHouseAccountPaymentForm.patchValue(response);
          this.disableBatchHouseAccountForm();
          this.batchAccounts = this.convertBatchAccountDtoToBatchAccountListItem(
            response.batchAccounts,
          );
        },
      });
  }

  viewBatchDetails() {
    const batchNo = this.batchHouseAccountPaymentForm.get('batchNo').value;
    if (batchNo) {
      this.getBatchDetailByBatchNo(batchNo);
    }
  }

  private getStores() {
    this.storeService
      .getStoresForSelection()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.stores = response;
        },
      });
  }

  private getTransactionTypeCodes() {
    this.paymentTransactionCodeService
      .getActivePaymentTransactionCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.transactionTypeCodes = response;
        },
      });
  }

  generateBatchNo() {
    this.batchDetailService
      .getNextBatchNo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.batchHouseAccountPaymentForm.reset({
            batchNo: '',
            batchTotalAmount: 0,
            transactionDate: new Date(),
            paymentTransactionCodeId: '',
            storeId: '',
            fulfilledAmount: 0,
            dueAmount: 0,
          });
          this.batchHouseAccountPaymentForm.patchValue({
            batchNo: response,
          });

          this.batchDetailDto = null;
          this.batchAccounts = [];
          ['storeId', 'paymentTransactionCodeId', 'transactionDate', 'batchTotalAmount'].forEach(
            field => this.batchHouseAccountPaymentForm.get(field).enable(),
          );
        },
      });
  }

  makeBatchPayment() {
    if (!this.batchDetailDto.id) return;

    const paymentTransactionCodeCategory = this.transactionTypeCodes.find(
      x => x.id === this.batchDetailDto.paymentTransactionCodeId,
    )?.paymentTransactionCodeCategory;

    this.batchPaymentSharedDataService.clearLeftOverAmount();
    const dialogRef = this.dialog.open(BatchPaymentProcessingDialogComponent, {
      width: '80%',
      height: '80%',
      data: {
        batchDetailDto: this.batchDetailDto,
        paymentTransactionCodeCategory: paymentTransactionCodeCategory,
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result?.success) {
          this.toasterService.success(
            '::BatchHouseAccountPayment:BatchPaymentProcessedSuccessfully',
          );
          this.getBatchDetailByBatchNo(this.batchDetailDto.batchNo);
        }
      });
  }

  getBatchDetailByBatchNo(batchNo: string) {
    if (!batchNo) return;
    this.batchDetailService
      .getBatchDetailByBatchNo(batchNo)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          this.batchHouseAccountPaymentForm.reset();
          this.batchAccounts = [];
          return throwError(() => error);
        }),
      )
      .subscribe({
        next: response => {
          this.batchDetailDto = response;
          this.batchHouseAccountPaymentForm.patchValue(response);
          this.batchAccounts = this.convertBatchAccountDtoToBatchAccountListItem(
            response.batchAccounts,
          );
          this.disableBatchHouseAccountForm();

          let paymentTransactionCode = this.transactionTypeCodes.find(
            x => x.id === response.paymentTransactionCodeId,
          );
          if (
            paymentTransactionCode.paymentTransactionCodeCategory ===
            PaymentTransactionCodeCategory.PaymentByCheck
          )
            this.columns = this.checkProcessingBatchTableColumns;
          else this.columns = this.cardProcessingBatchTableColumns;
        },
      });
  }

  private disableBatchHouseAccountForm() {
    ['storeId', 'paymentTransactionCodeId', 'transactionDate', 'batchTotalAmount'].forEach(field =>
      this.batchHouseAccountPaymentForm.get(field).disable(),
    );
  }

  onClickEditBatchAccountBtn(batchAccountListItem: BatchAccountListItem) {
    if (!this.batchDetailDto.id) return;

    const paymentTransactionCodeCategory = this.transactionTypeCodes.find(
      x => x.id === this.batchDetailDto.paymentTransactionCodeId,
    )?.paymentTransactionCodeCategory;

    this.batchPaymentSharedDataService.clearLeftOverAmount();
    const dialogRef = this.dialog.open(BatchPaymentProcessingDialogComponent, {
      width: '80%',
      height: '80%',
      data: {
        batchDetailDto: this.batchDetailDto,
        batchAccountListItem: batchAccountListItem,
        paymentTransactionCodeCategory: paymentTransactionCodeCategory,
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result?.success) {
          this.toasterService.success(
            '::BatchHouseAccountPayment:BatchPaymentProcessedSuccessfully',
          );
        }
        this.getBatchDetailByBatchNo(this.batchDetailDto.batchNo);
      });
  }

  getEnumKeyTitleByValue(data: Array<{ key: string; value: number }>, value: number): string {
    return data.find(item => item.value === value)?.key;
  }

  convertBatchAccountDtoToBatchAccountListItem(
    batchAccounts: BatchAccountDto[],
  ): BatchAccountListItem[] {
    const paymentTransactionCode = this.transactionTypeCodes.find(
      x => x.id === this.batchDetailDto.paymentTransactionCodeId,
    );
    const enumKeyTitle = this.getEnumKeyTitleByValue(
      paymentTransactionCodeCategoryOptions,
      paymentTransactionCode.paymentTransactionCodeCategory,
    );

    return batchAccounts.map(x => {
      let obj: BatchAccountListItem = {
        ...x,
        paymentType: enumKeyTitle,
        transactionCode: paymentTransactionCode.transactionCode,
        transactionDate: new Date(this.batchDetailDto.transactionDate),
      };
      return obj;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
