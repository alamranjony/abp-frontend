import { ToasterService } from '@abp/ng.theme.shared';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { CardPaymentResponseDto } from '@proxy/card';
import {
  CustomerDto,
  CustomerHouseAccountDto,
  CustomerService,
  CustomerHouseAccountService,
} from '@proxy/customers';
import { PaymentStatus } from '@proxy/orders';
import { paymentMethodOptions, PaymentMethod } from '@proxy/payment';
import {
  PaymentMasterWithDetailsDto,
  PaymentDetailsDto,
  PaymentMasterService,
  CreateUpdatePaymentMasterDto,
} from '@proxy/pospayment';
import { FinancialTransactionDto, FinancialTransactionService } from '@proxy/transactions';
import {
  Subject,
  takeUntil,
  forkJoin,
  finalize,
  map,
  of,
  Observable,
  tap,
  catchError,
  switchMap,
} from 'rxjs';
import { IndividualPaymentCreditCardComponent } from './individual-payment-credit-card/individual-payment-credit-card.component';
import { CreditCardPaymentDto } from 'src/app/shared/components/credit-card-payment/credit-card-payment-dto';
import { formatDecimals } from 'src/app/shared/number-utils';
import { CHECK_NO_MAX_LENGTH, CHECK_NO_MIN_LENGTH } from 'src/app/shared/constants';
import { sortEnumValues } from 'src/app/shared/common-utils';

@Component({
  selector: 'app-add-update-individual-payment',
  templateUrl: './add-update-individual-payment.component.html',
  styleUrl: './add-update-individual-payment.component.scss',
})
export class AddUpdateIndividualPaymentComponent implements OnInit, OnDestroy {
  singlePaymentForm: FormGroup;
  readonly id: string;
  customers: CustomerDto[] = [];
  paymentMethods = sortEnumValues(
    paymentMethodOptions.filter(c =>
      [PaymentMethod.Card, PaymentMethod.Cash, PaymentMethod.Check].includes(c.value),
    ),
  );
  customerTransactions: FinancialTransactionDto[] = [];
  filteredCustomerTransactions: FinancialTransactionDto[] = [];
  isAllSelected: boolean;
  customerHouseAccountDetails: CustomerHouseAccountDto;
  paymentMethodEnum = PaymentMethod;
  existingPayment: PaymentMasterWithDetailsDto;
  paymentDetails: PaymentDetailsDto[] = [];
  destroy$: Subject<void> = new Subject();
  loading = false;
  cardPaymentResponse: CardPaymentResponseDto;
  displayedColumns: string[] = ['select', 'date', 'invoiceNo', 'dueAmount', 'paidAmount', 'status'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private toaster: ToasterService,
    private customerService: CustomerService,
    private financialTransactionService: FinancialTransactionService,
    private customerHouseAccountService: CustomerHouseAccountService,
    private paymentMasterService: PaymentMasterService,
    public dialog: MatDialog,
  ) {
    this.id = this.route.snapshot.params['id'];
  }

  ngOnInit(): void {
    this.createSinglePaymentForm(null);
    this.id ? this.getCustomersWithExistingPaymentDetails() : this.getCustomers();
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

  onCustomerSelectionChanges(selectedCustomerId, masterId?) {
    const selectedCustomer = this.customers.find(c => c.id === selectedCustomerId);
    this.singlePaymentForm.patchValue({
      customerId: selectedCustomerId,
      address: selectedCustomer?.address1,
    });
    if (!masterId) {
      this.appliedAmount = 0;
      this.leftAmount = 0;
    } else {
      this.appliedAmount = this.paymentAmount - this.leftAmount;
    }
    this.getCustomerTransactions(selectedCustomerId, masterId);
    this.getCustomerHouseAccountDetails(selectedCustomerId);
  }

  onPaymentMethodSelectionChanges(paymentMethod: PaymentMethod) {
    paymentMethod === PaymentMethod.Check
      ? this.singlePaymentForm
          .get('checkNo')
          .addValidators([
            Validators.required,
            Validators.minLength(CHECK_NO_MIN_LENGTH),
            Validators.maxLength(CHECK_NO_MAX_LENGTH),
          ])
      : this.singlePaymentForm.get('checkNo').clearValidators();

    this.singlePaymentForm.get('checkNo').updateValueAndValidity();
  }

  getCustomerTransactions(customerId, masterId) {
    if (!customerId) {
      this.toaster.error('::IndividualPayment.CustomerNotSelected');
      return;
    }

    this.financialTransactionService
      .getCustomerUnInvoicedTransactions(customerId, masterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        res => {
          this.customerTransactions = res;
          this.filteredCustomerTransactions = this.customerTransactions;
          this.isAllSelected = false;
        },
        () => {
          this.customerTransactions = [];
          this.filteredCustomerTransactions = [];
          this.isAllSelected = false;
        },
      );
  }

  getCustomerHouseAccountDetails(customerId) {
    if (customerId) {
      this.customerHouseAccountService
        .getCustomerHouseAccountByCustomerId(customerId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          res => {
            this.customerHouseAccountDetails = res;
            this.singlePaymentForm
              .get('dueAmount')
              .setValue(formatDecimals(this.customerHouseAccountDetails?.balance || 0));
          },
          () => {
            this.customerHouseAccountDetails = null;
            this.singlePaymentForm.get('dueAmount').setValue(0);
          },
        );
    }
  }

  createSinglePaymentForm(formData?: PaymentMasterWithDetailsDto) {
    const totalAppliedAmount = formData?.totalPaidAmount - formData?.leftAmount;
    this.singlePaymentForm = this.fb.group({
      customerId: [formData?.customerId || '', Validators.required],
      address: [{ value: formData?.address || '', disabled: true }],
      dueAmount: [{ value: 0, disabled: true }],
      paymentTypeId: [formData?.paymentTypeId || PaymentMethod.Cash, Validators.required],
      checkNo: [formData?.checkNo || ''],
      cardNo: [''],
      totalPaidAmount: [formData?.totalPaidAmount || 0, Validators.required],
      appliedAmount: [{ value: totalAppliedAmount || 0, disabled: true }],
      leftAmount: [{ value: formData?.leftAmount || 0, disabled: true }],
      transactionDate: [formData?.transactionDate || new Date(), Validators.required],
      note: [formData?.note || ''],
      invoiceNo: [''],
      paymentMethodAdditionalFee: [0],
      responseCode: [''],
      authorizationCode: [''],
      referenceNumber: [''],
      responseMessage: [''],
      transactionId: [''],
      cardType: [''],
      cardBrandTransactionId: [''],
      token: [''],
      paymentDetails: this.fb.array([]),
    });
  }

  clearTransactionDate() {
    this.singlePaymentForm.get('transactionDate').setValue(null);
  }

  onFilter(searchKey) {
    if (!searchKey) {
      this.filteredCustomerTransactions = this.customerTransactions;
      return;
    }

    this.filteredCustomerTransactions = this.customerTransactions.filter(c =>
      c.transactionNumber?.toLowerCase().includes(searchKey.toLowerCase()),
    );
  }

  updateBalances(): void {
    this.appliedAmount = 0;
    this.leftAmount = this.paymentAmount;
    this.customerTransactions.forEach(transaction => {
      transaction.isSelected = false;
      transaction.paidAmount = 0;
      transaction.accountingStatusName = '';
    });
    this.isAllSelected = false;
  }

  onToggleAllSelection(selectionAllEvent) {
    const isSelected = selectionAllEvent.checked;

    if (isSelected) {
      this.appliedAmount = 0;
      this.leftAmount = this.paymentAmount;
    }

    if (isSelected && this.leftAmount <= 0) {
      this.toaster.error('::IndividualPayment.InSufficientBalance');
      selectionAllEvent.source.checked = false;
      return;
    }

    this.customerTransactions.forEach(transaction => {
      if (isSelected) {
        this.applyTransaction(transaction);
      } else {
        this.deselectTransaction(transaction);
      }

      this.updateLeftAmount();
    });

    this.isAllSelected = this.customerTransactions.every(c => c.isSelected === true);
    if (isSelected && !this.isAllSelected) {
      selectionAllEvent.source.checked = false;
    }
  }

  onSelectionChange(selectionEvent, id) {
    const isSelected = selectionEvent.checked;
    const transaction = this.customerTransactions.find(c => c.id === id);

    if (!transaction) return;

    this.updateTransactionState(transaction, isSelected);

    isSelected
      ? this.handleSelection(transaction, selectionEvent)
      : this.handleDeselection(transaction);

    this.updateLeftAmount();
    this.isAllSelected = this.customerTransactions.every(c => c.isSelected === true);
  }

  onAutoApplyClicked() {
    if (this.customerTransactions?.length === 0) {
      this.toaster.error('::IndividualPayment.EmptyInvoiceList');
      return;
    }

    this.appliedAmount = 0;
    this.leftAmount = this.paymentAmount;

    if (this.paymentAmount <= 0) {
      this.toaster.error('::IndividualPayment.EmptyPaymentAmount');
      return;
    }

    if (this.leftAmount <= 0) {
      this.toaster.error('::IndividualPayment.InSufficientBalance');
      return;
    }

    this.customerTransactions.forEach(transaction => {
      this.applyTransaction(transaction);

      this.updateLeftAmount();
    });

    this.isAllSelected = this.customerTransactions.every(c => c.isSelected === true);
  }

  onSubmit(): void {
    if (this.isFormInvalid()) return;

    this.processCardPayment()
      .pipe(
        takeUntil(this.destroy$),
        tap(() => (this.loading = true)),
        switchMap(isSuccessful => {
          if (!isSuccessful) {
            this.showErrorToast('::IndividualPayment.CardPaymentFailed');
            return of(false);
          }

          const data = this.prepareDataToSubmit();
          return this.id ? this.updateData(data) : this.saveData(data);
        }),
        finalize(() => (this.loading = false)),
      )
      .subscribe();
  }

  onCancel() {
    this.router.navigate(['/individual-house-account-payment']);
  }

  get paymentTypeId() {
    return this.singlePaymentForm.get('paymentTypeId').getRawValue();
  }

  get customerId() {
    return this.singlePaymentForm.get('customerId').getRawValue();
  }

  get paymentAmount() {
    return formatDecimals(this.singlePaymentForm.get('totalPaidAmount').getRawValue() || 0);
  }

  set paymentAmount(value) {
    this.singlePaymentForm.get('totalPaidAmount').setValue(formatDecimals(value));
  }

  get appliedAmount() {
    return formatDecimals(this.singlePaymentForm.get('appliedAmount').getRawValue() || 0);
  }

  set appliedAmount(value) {
    this.singlePaymentForm.get('appliedAmount').setValue(formatDecimals(value));
  }

  get leftAmount() {
    return formatDecimals(this.singlePaymentForm.get('leftAmount').getRawValue() || 0);
  }

  set leftAmount(value) {
    this.singlePaymentForm.get('leftAmount').setValue(formatDecimals(value));
  }

  private applyTransaction(transaction: any): void {
    if (this.leftAmount <= 0) {
      this.resetTransaction(transaction);
      return;
    }

    transaction.isSelected = true;
    this.applyPayment(transaction);
  }

  private applyPayment(transaction: any) {
    const paidAmount = Math.min(transaction.dueAmount, this.leftAmount);
    transaction.paidAmount = paidAmount;
    transaction.accountingStatusName = this.getPaymentStatusName(
      paidAmount === transaction.dueAmount ? PaymentStatus.Paid : PaymentStatus.Partial,
    );
    this.appliedAmount += paidAmount;
  }

  private resetTransaction(transaction: any): void {
    transaction.isSelected = false;
    transaction.paidAmount = 0;
    transaction.accountingStatusName = '';
  }

  private deselectTransaction(transaction): void {
    transaction.isSelected = false;
    this.appliedAmount -= transaction.paidAmount;
    transaction.paidAmount = 0;
    transaction.accountingStatusName = '';
  }

  private updateTransactionState(transaction, isSelected: boolean): void {
    transaction.isSelected = isSelected;
    if (isSelected) {
      transaction.paidAmount = transaction.dueAmount;
      transaction.accountingStatusName = this.getPaymentStatusName(PaymentStatus.Paid);
    }
  }

  private handleSelection(transaction, selectionEvent): void {
    if (this.leftAmount <= 0) {
      this.showInsufficientFundsError(transaction, selectionEvent);
      return;
    }

    this.applyPayment(transaction);
  }

  private handleDeselection(transaction): void {
    this.appliedAmount -= transaction.paidAmount;
    transaction.paidAmount = 0;
    transaction.accountingStatusName = '';
  }

  private updateLeftAmount(): void {
    this.leftAmount = this.paymentAmount - this.appliedAmount;
  }

  private showInsufficientFundsError(transaction, selectionEvent): void {
    this.toaster.error('::IndividualPayment.InSufficientBalance');
    transaction.isSelected = false;
    transaction.paidAmount = 0;
    transaction.accountingStatusName = '';
    selectionEvent.source.checked = false;
  }

  private getPaymentStatusName(paymentStatusId: PaymentStatus): string {
    return Object.keys(PaymentStatus)[
      Object.values(PaymentStatus).indexOf(paymentStatusId as unknown as PaymentStatus)
    ];
  }

  private getCustomersWithExistingPaymentDetails() {
    forkJoin([this.customerService.fetchCustomerDtos(), this.paymentMasterService.get(this.id)])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([customers, existingPayment]) => {
        this.customers = customers;
        this.existingPayment = existingPayment;
        this.createSinglePaymentForm(this.existingPayment);
        this.disablePaymentMaster();
        this.onCustomerSelectionChanges(this.existingPayment?.customerId, this.existingPayment.id);
      });
  }

  private disablePaymentMaster(): void {
    const controlsToDisable = [
      'transactionDate',
      'customerId',
      'paymentTypeId',
      'totalPaidAmount',
      'checkNo',
    ];
    controlsToDisable.forEach(control => {
      this.singlePaymentForm.get(control)?.disable();
    });
  }

  private processCardPayment(): Observable<boolean> {
    if (!this.customerId) {
      this.toaster.error('::IndividualPayment.CustomerNotSelected');
      return of(false);
    }

    if (!this.id && this.paymentTypeId === PaymentMethod.Card) {
      const creditCardPaymentDto: CreditCardPaymentDto = {
        customerId: this.customerId,
        amountToCharge: this.paymentAmount,
      };
      return this.dialog
        .open(IndividualPaymentCreditCardComponent, {
          width: '800px',
          height: 'auto',
          data: creditCardPaymentDto,
        })
        .afterClosed()
        .pipe(
          map(response => {
            if (response?.isSuccess) {
              this.cardPaymentResponse = response;
              this.singlePaymentForm.patchValue(this.cardPaymentResponse);
              this.singlePaymentForm
                .get('token')
                .setValue(
                  this.cardPaymentResponse?.cardToken ?? this.cardPaymentResponse?.savedToken,
                );
              return true;
            } else {
              return false;
            }
          }),
        );
    }

    return of(true);
  }

  private saveData(data: CreateUpdatePaymentMasterDto): Observable<PaymentMasterWithDetailsDto> {
    return this.paymentMasterService.create(data).pipe(
      tap(res => {
        if (res) {
          this.showSuccessToast('::IndividualPayment.CreateSuccessful');
          this.onCancel();
        } else {
          this.showErrorToast('::IndividualPayment.CreateFailed');
        }
      }),
      map(res => res),
      catchError(err => {
        this.handleError('::IndividualPayment.CreateFailed');
        return of(null);
      }),
    );
  }

  private updateData(data: CreateUpdatePaymentMasterDto): Observable<PaymentMasterWithDetailsDto> {
    return this.paymentMasterService.update(this.id, data).pipe(
      tap(res => {
        if (res) {
          this.showSuccessToast('::IndividualPayment.UpdateSuccessful');
          this.onCancel();
        } else {
          this.showErrorToast('::IndividualPayment.UpdateFailed');
        }
      }),
      map(res => res),
      catchError(err => {
        this.handleError('::IndividualPayment.UpdateFailed');
        return of(null);
      }),
    );
  }

  private prepareDataToSubmit(): CreateUpdatePaymentMasterDto {
    const data: CreateUpdatePaymentMasterDto = this.singlePaymentForm.getRawValue();
    data.paymentDetails = this.customerTransactions
      .filter(c => c.isSelected)
      .map(transaction => ({
        paymentMasterId: this.id ?? null,
        transactionNumber: transaction.transactionNumber,
        amount: transaction.paidAmount,
        paymentStatus: PaymentStatus[transaction.accountingStatusName],
      }));

    return data;
  }

  private isFormInvalid(): boolean {
    if (this.singlePaymentForm.invalid) {
      this.singlePaymentForm.markAllAsTouched();
      this.showErrorToast('::IndividualPayment.Fields.Invalid');
      return true;
    }

    if (!this.id && !this.customerTransactions.some(c => c.isSelected)) {
      this.showErrorToast('::IndividualPayment.PaymentDetailsNotSelected');
      return true;
    }

    return false;
  }

  private showSuccessToast(message: string): void {
    this.toaster.success(message);
  }

  private showErrorToast(message: string): void {
    this.toaster.error(message);
  }

  private handleError(message: string): void {
    this.showErrorToast(message);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
