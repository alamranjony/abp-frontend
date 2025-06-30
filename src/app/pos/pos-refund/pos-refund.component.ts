import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { PaymentHistoryLookUpDto, PaymentHistoryService } from '@proxy/payment-histories';
import { PaymentMethod } from '@proxy/payment';
import { SharedDataService } from '../shared-data.service';
import { OrderSummary } from '../models/order-summary.model';
import { CancelOrderDto, OrderService, OrderStatus, RefundPaymentDto } from '@proxy/orders';
import { ToasterService } from '@abp/ng.theme.shared';

@Component({
  selector: 'app-pos-refund',
  templateUrl: './pos-refund.component.html',
  styleUrls: ['./pos-refund.component.scss'],
})
export class PosRefundComponent implements OnInit, OnDestroy {
  destroy$: Subject<void> = new Subject();
  parentOrderId: string;
  orderId: string;
  refundHistories: PaymentHistoryLookUpDto[] = [];
  paymentHistories: PaymentHistoryLookUpDto[] = [];
  PaymentMethod = PaymentMethod;
  refundAmountInCash: number = 0;
  amountDue: number;
  orderSummary: OrderSummary;
  paymentHistoryTableColumns: string[] = ['paymentMethod', 'Amount'];
  refundHistoryTableColumns: string[] = ['paymentMethod', 'Amount'];
  totalRefundedAmount: number = 0;
  cancelReasonId: string;
  additionalComment?: string;

  isRefundedInCash: boolean = false;
  isRefundedInCard: boolean = false;
  isHouseAccountRefunded: boolean = false;

  isDoneBtnVisible: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private paymentHistoryService: PaymentHistoryService,
    private sharedDataService: SharedDataService,
    private orderService: OrderService,
    private toasterService: ToasterService,
    private dialog: MatDialog,
  ) {
    this.orderId = data.orderId;
    this.parentOrderId = data.parentOrderId;
    this.cancelReasonId = data.cancelReasonId;
    this.additionalComment = data.additionalComment;
  }

  ngOnInit() {
    this.getPaymentAndRefundHistories();
    this.subScribeToOrderSummary();
  }

  subScribeToOrderSummary() {
    this.sharedDataService.orderSummary.pipe(takeUntil(this.destroy$)).subscribe(x => {
      this.orderSummary = x;
      this.amountDue = x.amountPayable;
    });
  }

  getPaymentAndRefundHistories() {
    let paymentHistories$ = this.paymentHistoryService.getPaymentHistoriesByOrderId(this.orderId);

    let refundHistories$ = this.paymentHistoryService.getOrderRefundHistoriesByOrderId(
      this.orderId,
    );

    forkJoin([paymentHistories$, refundHistories$])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([paymentHistories, refundHistories]) => {
          this.processRefundHistories(refundHistories);
          this.decideDoneBtnVisibility();
          this.calculatedRefundedData();
          this.paymentHistories = paymentHistories;
        },
      });
  }

  decideDoneBtnVisibility() {
    this.isDoneBtnVisible = this.orderSummary.orderStatus !== OrderStatus.Cancelled;
  }

  processRefundHistories(refundHistories: PaymentHistoryLookUpDto[]) {
    this.refundHistories = refundHistories.map(x => ({
      ...x,
      amountCharged: Math.abs(x.amountCharged),
    }));
    this.totalRefundedAmount = this.refundHistories.reduce(
      (acc, payment) => acc + payment.amountCharged,
      0,
    );
    this.totalRefundedAmount = Number(this.sharedDataService.toFixed(this.totalRefundedAmount));
    this.calculateDueRefund();
  }

  onClickRefundBtn(paymentHistory: PaymentHistoryLookUpDto) {
    const paidAmount = this.getTotalPaidAmountOnPaymentMethod(
      paymentHistory.id,
      paymentHistory.paymentMethod,
    );

    const paymentMethod =
      paymentHistory.paymentMethod === PaymentMethod.Check
        ? PaymentMethod.Cash
        : paymentHistory.paymentMethod;

    const refundPaymentDto: RefundPaymentDto = {
      paymentMethod: paymentMethod,
      paidAmount: -paidAmount,
      orderId: this.orderId,
      parentOrderId: this.parentOrderId,
      customerId: this.orderSummary.customerId,
      paymentMethodAdditionalFee: 0,
      paymentHistoryId: paymentHistory.id,
    } as RefundPaymentDto;

    this.orderService
      .refundOrder(this.orderId, refundPaymentDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.refundAmountInCash = 0;
          this.getPaymentAndRefundHistories();
          this.calculatedRefundedData();
          this.toasterService.success('::Pos:RefundSuccessMessage');
        },
        error: () => {
          this.toasterService.error('::Pos:RefundFailedMessage');
        },
      });
  }

  getTotalPaidAmountOnPaymentMethod(paymentHistoryId: string, paymentMethod: PaymentMethod) {
    const filteredHistories = this.paymentHistories.filter(history => {
      if (paymentMethod === PaymentMethod.Check || paymentMethod === PaymentMethod.Cash)
        return (
          history.paymentMethod === PaymentMethod.Cash ||
          history.paymentMethod === PaymentMethod.Check
        );
      else return history.id === paymentHistoryId;
    });

    return filteredHistories.reduce((sum, history) => sum + history.amountCharged, 0);
  }

  getRefundHistories() {
    this.paymentHistoryService
      .getOrderRefundHistoriesByOrderId(this.orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(payments => {
        this.processRefundHistories(payments);
        this.calculatedRefundedData();
        this.decideDoneBtnVisibility();
      });
  }

  calculateDueRefund() {
    let amountDue = this.sharedDataService.toFixed(
      Number(this.orderSummary.amountPaid) - this.totalRefundedAmount - this.refundAmountInCash,
    );
    this.amountDue = Number(amountDue);
  }

  calculatedRefundedData() {
    this.isRefundedInCash = this.refundHistories.some(x => x.paymentMethod === PaymentMethod.Cash);
    this.isRefundedInCard = this.refundHistories.some(x => x.paymentMethod === PaymentMethod.Card);
    this.isHouseAccountRefunded = this.refundHistories.some(
      x => x.paymentMethod === PaymentMethod.HouseAccount,
    );

    this.paymentHistories = [...this.paymentHistories];
  }

  updateOrderStatus() {
    const cancelOrderDto: CancelOrderDto = {
      orderStatus: OrderStatus.Cancelled,
      cancelSaleReasonValueId: this.cancelReasonId,
      additionalComment: this.additionalComment,
    };

    this.orderService
      .cancelOrder(this.orderSummary.orderId, cancelOrderDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toasterService.success('::Pos:Order:SuccessMessage');
          this.sharedDataService.clearPos();
          this.sharedDataService.clearTip();
          this.dialog.closeAll();
        },
        error: () => {},
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
