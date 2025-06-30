import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomerBalanceInfoDto, CustomerHouseAccountService } from '@proxy/customers';
import { BatchPaymentSharedDataService } from '../batch-payment-shared-data.service';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import {
  BatchAccountListItem,
  FinancialTransactionBatchItem,
} from '../../account-receivable.models';
import {
  BatchAccountService,
  BatchDetailDto,
  BatchInvoiceDto,
  CreateUpdateBatchAccountDto,
  CreateUpdateBatchInvoiceDto,
} from '@proxy/batch-payments';
import { MatDialogRef } from '@angular/material/dialog';
import { BatchPaymentProcessingDialogComponent } from '../batch-payment-processing-dialog/batch-payment-processing-dialog.component';
import { FinancialTransactionService } from '@proxy/transactions';
import { ToasterService } from '@abp/ng.theme.shared';

@Component({
  selector: 'app-check-payment-processing',
  templateUrl: './check-payment-processing.component.html',
  styleUrls: ['./check-payment-processing.component.scss'],
})
export class CheckPaymentProcessingComponent implements OnInit, OnDestroy {
  private _batchDetailDto: BatchDetailDto;
  private _batchAccountListItem: BatchAccountListItem;
  financialTransactionItems: FinancialTransactionBatchItem[] = [];
  remainingPaymentAmountUnderBatch: number = 0;
  isEditMode: boolean = false;

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
    this.accountNo = value?.customerNo;
    this.isEditMode = !!value;
    if (this._batchAccountListItem?.customerNo) {
      this.getCustomerAccountInfo(Number(this.accountNo));
      this.getAllOpenInvoicesAndBatchedInvoices();
    }
  }

  checkPaymentProcessingForm: FormGroup;
  totalAppliedAmount: number = 0;
  leftOverAmount: number = 0;
  accountNo: string;
  customerBalanceInfoDto: CustomerBalanceInfoDto;
  addedInvoices: BatchInvoiceDto[] = [];
  destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private customerHouseAccountService: CustomerHouseAccountService,
    private batchPaymentSharedDataService: BatchPaymentSharedDataService,
    private batchAccountService: BatchAccountService,
    private dialogRef: MatDialogRef<BatchPaymentProcessingDialogComponent>,
    private financialTransactionService: FinancialTransactionService,
    private toasterService: ToasterService,
  ) {}

  ngOnInit() {
    this.buildForm();

    this.checkPaymentProcessingForm.get('paymentAmount').valueChanges.subscribe(value => {
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
        this.checkPaymentProcessingForm.get('totalAppliedAmount').setValue(value);
      });
  }

  buildForm() {
    this.checkPaymentProcessingForm = this.fb.group({
      customerNo: ['', Validators.required],
      checkNo: ['', Validators.required],
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

  private getFormControlValue(controlName: string) {
    return this.checkPaymentProcessingForm.get(controlName).value;
  }

  saveInvoices(invoices: FinancialTransactionBatchItem[]) {
    const paymentAmountIsInvalid = this.checkPaymentProcessingForm.value.paymentAmount <= 0;
    if (this.checkPaymentProcessingForm.invalid || paymentAmountIsInvalid) {
      this.checkPaymentProcessingForm.markAllAsTouched();

      if (paymentAmountIsInvalid) {
        this.toasterService.error('::BatchHouseAccountPayment:PaymentAmountRequired');
      }
      
      return;
    }

    let batchAccount = this.checkPaymentProcessingForm.getRawValue() as CreateUpdateBatchAccountDto;
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
            this.batchPaymentSharedDataService.clearAppliedAmount();
            this.batchPaymentSharedDataService.clearLeftOverAmount();
            this.checkPaymentProcessingForm.reset();
            this.customerBalanceInfoDto = null;
            this.totalAppliedAmount = 0;
            this.dialogRef.close({ success: true });
          },
        });
    }
    if (this.isEditMode) {
      this.batchAccountService
        .addInvoicesToBatchAccount(
          this._batchAccountListItem.id,
          batchAccount.createUpdateBatchInvoiceDtos,
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: _ => {
            this.batchPaymentSharedDataService.clearAppliedAmount();
            this.batchPaymentSharedDataService.clearLeftOverAmount();
            this.checkPaymentProcessingForm.reset();
            this.customerBalanceInfoDto = null;
            this.totalAppliedAmount = 0;
            this.dialogRef.close({ success: true });
          },
        });
    }
  }

  getCustomerOpenInvoices() {
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

  getAllOpenInvoicesAndBatchedInvoices() {
    const financialTransaction$ = this.financialTransactionService.getAllInvoicesByCustomerNo(
      Number(this.accountNo),
    );
    const batchAccount$ = this.batchAccountService.get(this._batchAccountListItem.id);

    forkJoin([financialTransaction$, batchAccount$]).subscribe({
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

        this.checkPaymentProcessingForm.patchValue(batchAccount);
        this.checkPaymentProcessingForm.get('customerNo').setValue(this.accountNo);
        this.checkPaymentProcessingForm.disable();
      },
    });
  }

  get paymentAmount() {
    return this.checkPaymentProcessingForm.get('paymentAmount').value;
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
