import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { PaymentHistoryLookUpDto, PaymentHistoryService } from '@proxy/payment-histories';
import { PaymentMethod } from '@proxy/payment';
import {
  CancelOrderDto,
  OrderService,
  OrderStatus,
  OrderType,
  RefundPaymentDto,
} from '@proxy/orders';
import { ToasterService } from '@abp/ng.theme.shared';
import { OrderSummary } from '../../models/order-summary.model';
import { SharedDataService } from '../../shared-data.service';

@Component({
  selector: 'app-pos-cr-refund',
  templateUrl: './pos-cr-refund.component.html',
  styleUrls: ['./pos-cr-refund.component.scss'],
})
export class PosCRRefundComponent implements OnInit, OnDestroy {
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
  isRefundBtnVisible: boolean = false;

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
    let paymentHistories$ = this.paymentHistoryService.getPaymentHistoriesByOrderId(
      this.parentOrderId,
    );

    let refundHistories$ = this.paymentHistoryService.getOrderRefundHistoriesByOrderId(
      this.orderId,
    );

    forkJoin([paymentHistories$, refundHistories$])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([paymentHistories, refundHistories]) => {
          this.processRefundHistories(refundHistories);
          this.decideDoneBtnVisibility();
          this.paymentHistories = paymentHistories;
          this.isRefundBtnVisible = this.paymentHistories.some(c => !c.isRefunded);
        },
      });
  }

  decideDoneBtnVisibility() {
    this.isDoneBtnVisible = this.orderSummary.orderStatus !== OrderStatus.Complete;
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

  onClickRefundBtn() {
    const paidAmount = this.paymentHistories.reduce(
      (sum, history) => sum + history.amountCharged,
      0,
    );

    const paymentMethod =
      this.orderSummary.orderType === OrderType.SWCR ? PaymentMethod.Cash : PaymentMethod.Card;

    const refundPaymentDto: RefundPaymentDto = {
      paymentMethod: paymentMethod,
      paidAmount: -paidAmount,
      orderId: this.orderId,
      parentOrderId: this.parentOrderId,
      customerId: this.orderSummary.customerId,
      orderType: this.orderSummary.orderType,
    } as RefundPaymentDto;

    this.orderService
      .refundCROrder(this.orderId, refundPaymentDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.refundAmountInCash = 0;
          this.getPaymentAndRefundHistories();
          this.toasterService.success('::Pos:RefundSuccessMessage');
        },
        error: () => {
          this.toasterService.error('::Pos:RefundFailedMessage');
        },
      });
  }

  getRefundHistories() {
    this.paymentHistoryService
      .getOrderRefundHistoriesByOrderId(this.orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(payments => {
        this.processRefundHistories(payments);
        this.decideDoneBtnVisibility();
      });
  }

  calculateDueRefund() {
    let amountDue = this.sharedDataService.toFixed(
      Number(this.orderSummary.amountPaid) - this.totalRefundedAmount - this.refundAmountInCash,
    );
    this.amountDue = Number(amountDue);
  }

  updateOrderStatus() {
    const cancelOrderDto: CancelOrderDto = {
      orderStatus: OrderStatus.Complete,
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
