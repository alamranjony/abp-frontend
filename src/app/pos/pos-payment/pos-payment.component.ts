import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PosPaymentDetailsComponent } from '../pos-payment-details/pos-payment-details.component';
import { SharedDataService } from '../shared-data.service';
import { ToasterService } from '@abp/ng.theme.shared';
import { OrderSummary } from '../models/order-summary.model';
import {
  CreateUpdateSubOrderDto,
  DeliveryCategory,
  SubOrderDeliveryStatus,
  OrderStatus,
  CreateUpdateOrderDto,
  PaymentStatus,
  OrderDeliveryStatus,
  OrderService,
  OrderType,
} from '@proxy/orders';
import { SubOrderItem } from '../models/sub-order-Item.model';
import { ProductCategoryType } from '@proxy/products';
import { Subject, takeUntil } from 'rxjs';
import { OrderActionType } from 'src/app/order-control-list/models/order-action-type.enum';

@Component({
  selector: 'app-pos-payment',
  templateUrl: './pos-payment.component.html',
  styleUrl: './pos-payment.component.scss',
})
export class PosPaymentComponent implements OnInit, OnDestroy {
  currentCartAmount: number;
  giftCardTotal: number;
  orderSummary: OrderSummary;
  noAddedSubOrderItemsInPos: boolean = false;
  deliverCategoryMissing: boolean = false;
  isGiftCardOrder: boolean = false;
  orderType = OrderType;
  destroy$: Subject<void> = new Subject();
  orderAction: OrderActionType;

  constructor(
    public dialog: MatDialog,
    private readonly sharedDataService: SharedDataService,
    private toasterService: ToasterService,
    private readonly orderService: OrderService,
  ) {}

  ngOnInit(): void {
    this.sharedDataService.cartTotalAmount$.pipe(takeUntil(this.destroy$)).subscribe(amount => {
      this.currentCartAmount = amount;
    });

    this.sharedDataService.giftCardPayment$.pipe(takeUntil(this.destroy$)).subscribe(giftCard => {
      this.giftCardTotal = giftCard.giftCardTotalAmount;
    });
    this.sharedDataService.orderSummary.pipe(takeUntil(this.destroy$)).subscribe(x => {
      this.orderSummary = x;
      this.noAddedSubOrderItemsInPos = x.subOrderItems.length === 0;
      this.deliverCategoryMissing = x.subOrderItems.some(x => !x.deliveryCategory);
    });

    this.getOrderAction();

    this.sharedDataService.resetOrderTypeAction$.pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res) this.orderAction = null;
    });
  }

  getOrderAction() {
    const { orderId, action } = window.history.state || {};
    if (!orderId || !action) return;

    this.orderAction = action;
  }

  showPaymentDetails(): void {
    this.dialog.open(PosPaymentDetailsComponent, {
      width: '700px',
      data: {
        isGiftCardOrder: this.isGiftCardOrder,
      },
    });
  }

  saveOrder() {
    if (this.noAddedSubOrderItemsInPos || this.isPaymentDisable()) return;
    if (this.deliverCategoryMissing) {
      this.toasterService.error('::Pos:Payment:DeliveryCategoryMissing');
      return;
    }

    const isAllSubOrderCarryOut = this.orderSummary.subOrderItems.every(
      x => x.deliveryCategory === DeliveryCategory.CarryOut,
    );
    if (!isAllSubOrderCarryOut && !this.orderSummary?.customer) {
      this.toasterService.error('::Pos:Payment:SelectCustomer');
      return;
    }

    const createUpdateSubOrderDtos: CreateUpdateSubOrderDto[] = [];
    this.isGiftCardOrder = this.orderSummary.subOrderItems.some(
      item => item.productItem.productCategoryType === ProductCategoryType.GiftCard,
    );
    this.orderSummary.subOrderItems.forEach((item: SubOrderItem) => {
      item.deliveryStatus = SubOrderDeliveryStatus.ToBeDelivered;
      createUpdateSubOrderDtos.push(item as CreateUpdateSubOrderDto);
    });

    const updateOrderDto: CreateUpdateOrderDto = {
      ...this.orderSummary,
      orderTotal: this.orderSummary.amountPayable,
      deliveryFeeTotal: this.orderSummary.deliveryFeeTotal,
      discountCodeId: this.orderSummary.appliedDiscountCodeId,
      orderDiscount: this.orderSummary.totalDiscount,
      isPartialPaymentAllowed: true,
      paidAmount: Number(this.orderSummary.amountPaid),
      tipAmount: this.orderSummary.tipAmount,
      taxAmount: this.orderSummary.taxAmount,
      customerId: this.orderSummary.customer?.id,
      orderType: this.orderSummary.orderType,
      orderStatus: OrderStatus.Abandoned,
      paymentStatus: PaymentStatus.Unpaid,
      deliveryStatus: OrderDeliveryStatus.ToBeDelivered,
      reviewType: this.orderSummary.reviewType,
      createUpdateSubOrderDtos: createUpdateSubOrderDtos,
      isGiftCardOrder: this.isGiftCardOrder,
      tipValueTypeId: this.orderSummary.tipValueTypeId,
    };

    this.orderService
      .update(this.orderSummary.orderId, updateOrderDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showPaymentDetails();
        },
        error: () => {
          this.toasterService.error('::Pos:OrderUpdateFailed');
        },
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isPaymentDisable() {
    return (
      this.orderSummary?.orderType === OrderType.PU ||
      this.orderSummary?.orderType === OrderType.DO ||
      this.orderSummary?.orderType === OrderType.PO ||
      this.orderAction === OrderActionType.ReOrderForCancelledItem
    );
  }
}
