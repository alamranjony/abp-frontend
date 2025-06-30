import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  BatchDetailDto,
  BatchInvoiceDto,
  BatchAccountService,
  CreateUpdateBatchAccountDto,
  CreateUpdateBatchInvoiceDto,
} from '@proxy/batch-payments';
import { CustomerBalanceInfoDto, CustomerHouseAccountService } from '@proxy/customers';
import { FinancialTransactionService } from '@proxy/transactions';
import { Subject, takeUntil, forkJoin, Observable, of, map, switchMap } from 'rxjs';
import {
  BatchAccountListItem,
  FinancialTransactionBatchItem,
} from '../../account-receivable.models';
import { BatchPaymentProcessingDialogComponent } from '../batch-payment-processing-dialog/batch-payment-processing-dialog.component';
import { BatchPaymentSharedDataService } from '../batch-payment-shared-data.service';
import { ToasterService } from '@abp/ng.theme.shared';
import { BatchCardPaymentDialogComponent } from '../batch-card-payment-dialog/batch-card-payment-dialog.component';
import { CreditCardPaymentDto } from 'src/app/shared/components/credit-card-payment/credit-card-payment-dto';
import { CardPaymentResponseDto } from '@proxy/card';

@Component({
  selector: 'app-card-payment-processing',
  templateUrl: './card-payment-processing.component.html',
  styleUrls: ['./card-payment-processing.component.scss'],
})
export class CardPaymentProcessingComponent implements OnInit {
  private _batchDetailDto: BatchDetailDto;
  private _batchAccountListItem: BatchAccountListItem;
  financialTransactionItems: FinancialTransactionBatchItem[] = [];
  isEditMode: boolean = false;
  batchAccountId: string;

  cardPaymentResponse: CardPaymentResponseDto;
  cardPaymentProcessingForm: FormGroup;
  totalAppliedAmount: number = 0;
  leftOverAmount: number = 0;
  remainingPaymentAmountUnderBatch: number = 0;
  accountNo: string;
  customerBalanceInfoDto: CustomerBalanceInfoDto;
  addedInvoices: BatchInvoiceDto[] = [];
  paymentCompleted: boolean = false;
  destroy$ = new Subject<void>();

  @Input() set batchDetailDto(value: BatchDetailDto) {
    if (!value) return;
    this._batchDetailDto = value;
    const totalPaymentAmountUnderBatch = this._batchDetailDto.batchAccounts.reduce(
      (sum, batchAccount) => sum + batchAccount.paymentAmount,
      0,
    );
    this.remainingPaymentAmountUnderBatch = this.batchPaymentSharedDataService.toFixed(
      value.batchTotalAmount - totalPaymentAmountUnderBatch,
    );
  }

  @Input() set batchAccountListItem(value: BatchAccountListItem) {
    this._batchAccountListItem = value;
    this.batchAccountId = value?.id;
    this.accountNo = value?.customerNo;
    this.isEditMode = !!value;
    this.paymentCompleted = !!value;
    if (this._batchAccountListItem?.customerNo) {
      this.getCustomerAccountInfo(Number(this.accountNo));
      this.getAllOpenInvoicesAndBatchedInvoices();
    }
  }

  get paymentAmount() {
    return this.cardPaymentProcessingForm.get('paymentAmount').value;
  }

  constructor(
    private fb: FormBuilder,
    private customerHouseAccountService: CustomerHouseAccountService,
    private batchPaymentSharedDataService: BatchPaymentSharedDataService,
    private batchAccountService: BatchAccountService,
    private dialogRef: MatDialogRef<BatchPaymentProcessingDialogComponent>,
    private financialTransactionService: FinancialTransactionService,
    private toasterService: ToasterService,
    public dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.buildForm();

    this.cardPaymentProcessingForm.get('paymentAmount').valueChanges.subscribe(value => {
      this.updateLeftAmount();
    });

    this.batchPaymentSharedDataService.leftOverAmount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.leftOverAmount = value;
      });

    this.batchPaymentSharedDataService.appliedAmount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.cardPaymentProcessingForm.get('totalAppliedAmount').setValue(value);
      });
  }

  buildForm() {
    this.cardPaymentProcessingForm = this.fb.group({
      customerNo: ['', Validators.required],
      cardNo: ['', Validators.required],
      paymentAmount: [
        0,
        [Validators.required, Validators.min(0), this.maxPaymentValidator.bind(this)],
      ],
      totalAppliedAmount: [{ value: 0, disabled: true }, Validators.required],
      note: [''],
    });
  }

  maxPaymentValidator(control: AbstractControl) {
    if (this._batchDetailDto && control.value > this.remainingPaymentAmountUnderBatch) {
      return { maxExceeded: true };
    }
    return null;
  }

  updateLeftAmount() {
    const paymentAmount = this.getFormControlValue('paymentAmount');
    const totalAppliedAmount = this.getFormControlValue('totalAppliedAmount');
    this.leftOverAmount = this.batchPaymentSharedDataService.toFixed(
      paymentAmount - totalAppliedAmount,
    );
    this.batchPaymentSharedDataService.setLeftOverAmount(this.leftOverAmount);
  }

  private getFormControlValue(controlName: string) {
    return this.cardPaymentProcessingForm.get(controlName).value;
  }

  onClickSearchBtn() {
    let accountNo = this.getFormControlValue('customerNo');
    if (accountNo?.trim()?.length === 0) return;

    this.accountNo = accountNo;
    this.getCustomerAccountInfo(Number(accountNo));
    this.getCustomerOpenInvoices();
  }

  getCustomerAccountInfo(accountNo: number) {
    this.customerHouseAccountService
      .getCustomerHouseAccountBalance(accountNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.customerBalanceInfoDto = response;
        },
      });
  }

  saveInvoices(invoices: FinancialTransactionBatchItem[]) {
    if (this.cardPaymentProcessingForm.invalid) {
      this.cardPaymentProcessingForm.markAllAsTouched();

      if (!this.cardPaymentProcessingForm.value.cardNo) {
        this.toasterService.error('::BatchHouseAccountPayment:PaymentAmountNeedsToBePaid');
      }

      return;
    }

    let batchAccount = this.cardPaymentProcessingForm.getRawValue() as CreateUpdateBatchAccountDto;
    batchAccount.batchDetailId = this._batchDetailDto.id;
    batchAccount.createUpdateBatchInvoiceDtos = invoices.map(x => {
      let createUpdateInvoiceDto: CreateUpdateBatchInvoiceDto = {
        ...x,
        totalAmount: x.totalAmount,
        appliedAmount: x.appliedAmount,
      };
      return createUpdateInvoiceDto;
    });
    if (!this.isEditMode) {
      this.batchAccountService
        .create(batchAccount)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: _ => {
            this.onSaveSuccess();
          },
        });
    }
    if (this.isEditMode) {
      this.batchAccountService
        .addInvoicesToBatchAccount(this.batchAccountId, batchAccount.createUpdateBatchInvoiceDtos)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: _ => {
            this.onSaveSuccess();
          },
        });
    }
  }

  private onSaveSuccess() {
    this.batchPaymentSharedDataService.clearAppliedAmount();
    this.batchPaymentSharedDataService.clearLeftOverAmount();
    this.cardPaymentProcessingForm.reset();
    this.customerBalanceInfoDto = null;
    this.totalAppliedAmount = 0;
    this.dialogRef.close({ success: true });
  }

  private getCustomerOpenInvoices() {
    this.financialTransactionService
      .getAllInvoicesByCustomerNo(Number(this.accountNo))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.financialTransactionItems = response.map(
            x =>
              ({
                ...x,
                appliedAmount: 0,
                amount: 0,
                selected: false,
                isPreviouslyApplied: false,
              }) as FinancialTransactionBatchItem,
          );
        },
      });
  }

  private getAllOpenInvoicesAndBatchedInvoices() {
    const financialTransaction$ = this.financialTransactionService.getAllInvoicesByCustomerNo(
      Number(this.accountNo),
    );
    const batchAccount$ = this.batchAccountService.get(this._batchAccountListItem.id);

    forkJoin([financialTransaction$, batchAccount$])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([financialTransactions, batchAccount]) => {
          this.addedInvoices = batchAccount.batchInvoices;
          this.financialTransactionItems = [
            ...this.addedInvoices.map(invoice => {
              let matchedFinancialTransaction = financialTransactions.find(
                x => x.transactionNumber === invoice.transactionNumber,
              );
              const dueAmount = matchedFinancialTransaction
                ? matchedFinancialTransaction.dueAmount
                : 0;

              return {
                ...invoice,
                totalAmount: invoice.totalAmount,
                dueAmount: this.batchPaymentSharedDataService.toFixed(dueAmount),
                appliedAmount: invoice.appliedAmount,
                selected: true,
                isPreviouslyApplied: true,
              } as FinancialTransactionBatchItem;
            }),
            ...financialTransactions
              .filter(
                x =>
                  !this.addedInvoices.some(
                    invoice => invoice.transactionNumber === x.transactionNumber,
                  ),
              )
              .map(
                x =>
                  ({
                    ...x,
                    appliedAmount: 0,
                    dueAmount: x.dueAmount,
                    amount: 0,
                    selected: false,
                    isPreviouslyApplied: false,
                  }) as FinancialTransactionBatchItem,
              ),
          ];
          this.cardPaymentProcessingForm.patchValue(batchAccount);
          this.cardPaymentProcessingForm.get('customerNo').setValue(this.accountNo);
          this.cardPaymentProcessingForm.disable();
        },
      });
  }

  unApplyInvoice(transactionNumber: string) {
    this.batchAccountService
      .removeInvoiceFromBatchAccount(this._batchAccountListItem.id, transactionNumber)
      .subscribe({
        next: response => {
          this.getAllOpenInvoicesAndBatchedInvoices();
        },
      });
  }

  private processCardPayment(): Observable<boolean> {
    const paymentAmount = this.getFormControlValue('paymentAmount');

    const creditCardPaymentDto: CreditCardPaymentDto = {
      customerId: this.customerBalanceInfoDto.customerId,
      amountToCharge: paymentAmount,
    };
    return this.dialog
      .open(BatchCardPaymentDialogComponent, {
        width: '800px',
        height: 'auto',
        data: creditCardPaymentDto,
      })
      .afterClosed()
      .pipe(
        map(response => {
          if (response?.isSuccess) {
            this.cardPaymentResponse = response;
            this.paymentCompleted = true;
            return true;
          } else {
            this.cardPaymentResponse = null;
            this.paymentCompleted = true;
            return false;
          }
        }),
      );
  }

  openPaymentDialog() {
    const isMaxAmountExceeded = this.cardPaymentProcessingForm
      .get('paymentAmount')
      .hasError('maxExceeded');
      
    if (this.cardPaymentProcessingForm.value.paymentAmount <= 0 || isMaxAmountExceeded) {
      this.cardPaymentProcessingForm.markAllAsTouched();
      this.toasterService.error('::BatchHouseAccountPayment:PaymentAmountRequired');
      return;
    }

    this.processCardPayment()
      .pipe(
        takeUntil(this.destroy$),
        switchMap(isSuccessful => {
          return of(isSuccessful);
        }),
      )
      .subscribe({
        next: x => {
          if (x) {
            let batchAccount =
              this.cardPaymentProcessingForm.getRawValue() as CreateUpdateBatchAccountDto;
            batchAccount.batchDetailId = this._batchDetailDto.id;
            batchAccount.cardNo = this.cardPaymentResponse.transactionId;
            this.batchAccountService
              .create(batchAccount)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: batchAccountDto => {
                  this.batchAccountId = batchAccountDto.id;
                  this.isEditMode = true;
                  this.paymentCompleted = true;
                  this.cardPaymentProcessingForm.patchValue({
                    ...batchAccount,
                    customerNo: this.accountNo,
                  });
                  this.cardPaymentProcessingForm.disable();
                },
              });
          }
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
