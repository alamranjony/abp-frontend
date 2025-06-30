import { ListService } from '@abp/ng.core';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FinancialTransactionBatchItem } from '../../account-receivable.models';
import { ToasterService } from '@abp/ng.theme.shared';
import { BatchPaymentSharedDataService } from '../batch-payment-shared-data.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-invoices',
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.scss'],
  providers: [ListService],
})
export class InvoicesComponent implements OnInit, OnDestroy {
  _financialTransactionItems: FinancialTransactionBatchItem[] = [];
  @Input() isEditMode: boolean = false;
  @Input() paymentAmount: number = 0;
  @Input() paymentCompleted: boolean = false;

  addedfinancialTransactionItemsOnEditMode: FinancialTransactionBatchItem[] = [];

  readonly columns: string[] = [
    'select',
    'transactionNumber',
    'totalAmount',
    'dueAmount',
    'appliedAmount',
    'status',
    'actions',
  ];

  searchedInvoiceNo: string;

  @Input() set financialTransactionItems(value: FinancialTransactionBatchItem[]) {
    this._financialTransactionItems = value;
  }

  @Output() selectedInvoicesChange = new EventEmitter<FinancialTransactionBatchItem[]>();
  @Output() unApplyInvoiceChange = new EventEmitter<string>();

  leftOverAmount: number = 0;

  destroy$ = new Subject<void>();

  constructor(
    public readonly list: ListService,
    private toasterService: ToasterService,
    private batchPaymentSharedDataService: BatchPaymentSharedDataService,
  ) {}

  ngOnInit() {
    this.batchPaymentSharedDataService.leftOverAmount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.leftOverAmount = value;
      });
  }

  onCheckboxChange(invoiceItem: FinancialTransactionBatchItem): void {
    if (invoiceItem.selected && this.leftOverAmount <= 0) {
      this.toasterService.error('::BatchHouseAccountPayment:NoLeftOverAmountToApply');
      return;
    }

    this.updateInvoiceData(invoiceItem);
  }

  applyInvoice() {
    if (!this.paymentCompleted) return;

    if (!this.searchedInvoiceNo?.trim()) {
      this.toasterService.error('::BatchHouseAccountPayment:InvalidInvoiceNumber');
      return;
    }

    if (this._financialTransactionItems.length === 0) {
      this.toasterService.error('::BatchHouseAccountPayment:NoInvoicesToApply');
      return;
    }

    const invoiceItem = this._financialTransactionItems.find(
      invoice => invoice.transactionNumber === this.searchedInvoiceNo,
    );
    if (!invoiceItem) {
      this.toasterService.error('::BatchHouseAccountPayment:InvoiceNotFound');
      return;
    }

    if (invoiceItem.isPreviouslyApplied) {
      this.toasterService.error('::BatchHouseAccountPayment:NotEligibleForUnselection');
      return;
    }

    invoiceItem.selected = !invoiceItem.selected;
    this.updateInvoiceData(invoiceItem);
  }

  private updateInvoiceData(invoiceItem) {
    this.updateInvoiceAmounts(invoiceItem);
    this.updateLeftOverAmount();
    this.updateAddedFinancialTransactionItems(invoiceItem);
    this.calcualteTotalAppliedAmount();
  }

  private updateInvoiceAmounts(invoiceItem: FinancialTransactionBatchItem): void {
    let dueAmount = invoiceItem.dueAmount;
    let appliedAmount = invoiceItem.appliedAmount;
    if (invoiceItem.selected) {
      appliedAmount += Math.min(dueAmount, this.leftOverAmount);
      dueAmount -= appliedAmount;
    } else {
      dueAmount += appliedAmount;
      appliedAmount = 0;
    }
    invoiceItem.appliedAmount = this.batchPaymentSharedDataService.toFixed(appliedAmount);
    invoiceItem.dueAmount = this.batchPaymentSharedDataService.toFixed(dueAmount);
  }

  private updateLeftOverAmount(): void {
    let totalAppliedAmount = 0;
    for (let item of this._financialTransactionItems) {
      totalAppliedAmount += item.appliedAmount;
    }

    let leftOverAmount = this.batchPaymentSharedDataService.toFixed(
      this.paymentAmount - totalAppliedAmount,
    );
    this.leftOverAmount = leftOverAmount;
    this.batchPaymentSharedDataService.setLeftOverAmount(this.leftOverAmount);
  }

  private updateAddedFinancialTransactionItems(invoiceItem: FinancialTransactionBatchItem): void {
    if (invoiceItem.selected) {
      this.addedfinancialTransactionItemsOnEditMode.push(invoiceItem);
    } else {
      this.addedfinancialTransactionItemsOnEditMode =
        this.addedfinancialTransactionItemsOnEditMode.filter(
          item => item.transactionNumber !== invoiceItem.transactionNumber,
        );
    }
  }

  onClickAutoApply() {
    if (!this.paymentCompleted) return;
    let paymentAmount = this.leftOverAmount;

    for (let invoiceItem of this._financialTransactionItems) {
      if (paymentAmount <= 0) break;

      if (!invoiceItem.selected && !invoiceItem.isPreviouslyApplied && invoiceItem.dueAmount > 0) {
        invoiceItem.selected = true;
        const amountToApply = Math.min(invoiceItem.dueAmount, paymentAmount);
        invoiceItem.appliedAmount = this.batchPaymentSharedDataService.toFixed(
          invoiceItem.appliedAmount + amountToApply,
        );
        invoiceItem.dueAmount = this.batchPaymentSharedDataService.toFixed(
          invoiceItem.dueAmount - amountToApply,
        );
        paymentAmount = this.batchPaymentSharedDataService.toFixed(paymentAmount - amountToApply);
        this.updateAddedFinancialTransactionItems(invoiceItem);
      }
    }

    this.leftOverAmount = paymentAmount;
    this.batchPaymentSharedDataService.setLeftOverAmount(this.leftOverAmount);
    this.calcualteTotalAppliedAmount();
  }

  calcualteTotalAppliedAmount() {
    const totalAppliedAmount = this._financialTransactionItems
      .filter(invoice => invoice.selected)
      .reduce((sum, invoice) => sum + invoice.appliedAmount, 0);

    let totalAppliedAmountAfterFormat =
      this.batchPaymentSharedDataService.toFixed(totalAppliedAmount);
    this.batchPaymentSharedDataService.setAppliedAmount(totalAppliedAmountAfterFormat);
  }

  onClickSaveBtn() {
    const selectedInvoices = this._financialTransactionItems.filter(invoice => invoice.selected);
    const invoicesToEmit = this.isEditMode
      ? this.addedfinancialTransactionItemsOnEditMode
      : selectedInvoices;
    this.selectedInvoicesChange.emit(invoicesToEmit);
  }

  onClickUnApplyBtn(invoiceItem: FinancialTransactionBatchItem) {
    this.unApplyInvoiceChange.emit(invoiceItem.transactionNumber);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
