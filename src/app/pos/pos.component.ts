import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  OrderDeliveryStatus,
  OrderService,
  OrderStatus,
  OrderType,
  PaymentStatus,
  UpdateOrderStatusDto,
} from '@proxy/orders';
import { SharedDataService } from './shared-data.service';
import { OrderSummary } from './models/order-summary.model';
import { ToasterService } from '@abp/ng.theme.shared';
import { map, Observable, Subject, takeUntil } from 'rxjs';
import { OrderActionType } from '../order-control-list/models/order-action-type.enum';
import { MatDialog } from '@angular/material/dialog';
import { PosRefundComponent } from './pos-refund/pos-refund.component';
import { PosCancelReasonDialogComponent } from './pos-cancel-reason-dialog/pos-cancel-reason-dialog.component';
import { PosCRRefundComponent } from './pos-refund/pos-cr-refund/pos-cr-refund.component';

@Component({
  selector: 'app-pos',
  templateUrl: './pos.component.html',
  styleUrl: './pos.component.scss',
})
export class POSComponent implements OnInit, OnDestroy {
  orderSummary: OrderSummary;
  destroy$: Subject<void> = new Subject();
  orderAction: OrderActionType;
  deliverCategoryMissing: boolean = false;
  isOrderToBeRefunded$: Observable<boolean>;

  constructor(
    private orderService: OrderService,
    private readonly sharedDataService: SharedDataService,
    private toasterService: ToasterService,
    public dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.sharedDataService.orderSummary.pipe(takeUntil(this.destroy$)).subscribe(x => {
      this.orderSummary = x;
      this.deliverCategoryMissing = x.subOrderItems.some(x => !x.deliveryCategory);
    });

    this.getReOrderAction();
    this.isOrderToBeRefunded$ = this.sharedDataService.orderSummary.pipe(
      map(x => x.orderType === OrderType.IVCR || x.orderType === OrderType.SWCR),
    );

    this.subscribeToRefundOrderNotification();

    this.sharedDataService.resetOrderTypeAction$.pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res) this.orderAction = null;
    });
  }

  subscribeToRefundOrderNotification() {
    this.sharedDataService.refundOrder$.pipe(takeUntil(this.destroy$)).subscribe(cancelOrderDto => {
      if (cancelOrderDto) {
        this.dialog.open(PosRefundComponent, {
          width: '700px',
          data: {
            orderId: this.orderSummary.orderId,
            parentOrderId: this.orderSummary.orderId,
            cancelReasonId: cancelOrderDto.cancelSaleReasonValueId,
            additionalComment: cancelOrderDto.additionalComment,
          },
        });
      }
    });
  }

  getReOrderAction() {
    const { orderId, action } = window.history.state || {};
    if (!orderId || !action) return;

    this.orderAction = action;
  }

  onSave() {
    if (!this.isApplicableToUpdateOrderStatus()) return;

    if (this.deliverCategoryMissing) {
      this.toasterService.error('::Pos:Payment:DeliveryCategoryMissing');
      return;
    }

    const updateOrderStatusDto: UpdateOrderStatusDto = {
      orderStatus: OrderStatus.InProgress,
      paymentStatus: PaymentStatus.Paid,
      deliveryStatus: OrderDeliveryStatus.ToBeDelivered,
      changeDueAmount: Number(this.orderSummary?.changeDue),
    };

    this.orderService
      .updateOrderStatus(this.orderSummary.orderId, updateOrderStatusDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.toasterService.success('::Pos:Order:SuccessMessage');
        this.sharedDataService.clearPos();
        this.sharedDataService.clearTip();
        this.sharedDataService.clearOrderAction();
      });
  }

  private isApplicableToUpdateOrderStatus() {
    return (
      this.orderSummary &&
      this.orderSummary.orderId &&
      (this.orderSummary.orderType === OrderType.PU ||
        this.orderSummary.orderType === OrderType.PO ||
        this.orderSummary.orderType === OrderType.DO ||
        this.orderAction === OrderActionType.ReOrderForCancelledItem)
    );
  }

  onClickRefundBtn() {
    const dialogRef = this.dialog.open(PosCancelReasonDialogComponent, {
      width: '40%',
    });
    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: { cancelReasonId: string; additionalComment?: string }) => {
        if (result.cancelReasonId) {
          this.openRefundDialog(result.cancelReasonId, result.additionalComment);
        }
      });
  }

  openRefundDialog(cancelReasonId: string, additionalComment?: string) {
    this.dialog.open(PosCRRefundComponent, {
      width: '700px',
      data: {
        orderId: this.orderSummary.orderId,
        parentOrderId: this.orderSummary.parentOrderId,
        cancelReasonId: cancelReasonId,
        additionalComment: additionalComment,
      },
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
