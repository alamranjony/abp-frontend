import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  DeliveryCategory,
  OrderDetailsDto,
  OrderDto,
  OrderService,
  OrderStatus,
  OrderType,
  PaymentStatus,
  ReplacementOrderDto,
  SubOrderDeliveryStatus,
  SubOrderDto,
} from '@proxy/orders';
import { ProductDto } from '@proxy/products';
import { SharedModule } from 'src/app/shared/shared.module';
import { BackButtonComponent } from '../../shared/components/back-button/back-button.component';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import {
  AccountingStatus,
  FinancialTransactionDto,
  FinancialTransactionService,
} from '@proxy/transactions';
import { OrderActionType } from '../models/order-action-type.enum';
import { SharedDataService } from 'src/app/pos/shared-data.service';
import { MatDialog } from '@angular/material/dialog';
import { OrderReplacementReasonDialogComponent } from './order-replacement-reason-dialog/order-replacement-reason-dialog.component';
import { Confirmation, ConfirmationService, ToasterService } from '@abp/ng.theme.shared';
import { DIALOG_ENTER_ANIMATION_DURATION } from 'src/app/shared/dialog.constants';
import { SubOrderDeliveryDetailsDialogComponent } from './sub-order-delivery-details-dialog/sub-order-delivery-details-dialog.component';
import { PaymentHistoryLookUpDto, PaymentHistoryService } from '@proxy/payment-histories';
import { PaymentMethod } from '@proxy/payment';

type MappedSubOrder = {
  subOrder: SubOrderDto;
  product: ProductDto | undefined;
};

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [SharedModule, BackButtonComponent],
  templateUrl: './order-details.component.html',
  styleUrl: './order-details.component.scss',
})
export class OrderDetailsComponent implements OnInit, OnDestroy {
  orderDetails: OrderDetailsDto;
  mappedSubOrders: MappedSubOrder[];
  isOrderDetailsCallComplete: boolean = false;
  defaultImageURL = 'assets/images/demo/demo.png';
  destroy$ = new Subject<void>();
  financialTransactionDto: FinancialTransactionDto;
  isOrderEligibleForIVCR: boolean = false;
  isOrderEligibleForSWCR: boolean = false;
  isEligibleForRefund: boolean = false;
  orderId: string;
  readonly orderStatus = OrderStatus;
  readonly paymentStatus = PaymentStatus;

  selectedSubOrderIds: string[] = [];
  ignoredHighlightedSubOrderIds: string[] = [];
  selectAll: boolean = false;
  paymentHistories: PaymentHistoryLookUpDto[] = [];

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private financialTransactionService: FinancialTransactionService,
    private router: Router,
    private sharedDataService: SharedDataService,
    public dialog: MatDialog,
    private confirmation: ConfirmationService,
    private toasterService: ToasterService,
    private paymentHistoryService: PaymentHistoryService,
  ) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.params['id'];
    if (this.orderId) {
      this.getOrderDetailsWithFinancialTransaction();
    }
  }

  getOrderDetailsById() {
    this.orderService
      .getOrderDetailsById(this.orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(orderDetails => {
        this.orderDetails = orderDetails;
        this.mappedSubOrders = orderDetails.subOrders.map(subOrder => ({
          subOrder,
          product: orderDetails.products.find(product => product.id === subOrder.productId),
        }));
        this.isOrderDetailsCallComplete = true;

        this.isEligibleForRefund =
          this.orderDetails.order.orderStatus === OrderStatus.Complete &&
          !this.isOrderEligibleForIVCR;
      });
  }

  getOrderDetailsWithFinancialTransaction() {
    const orderDetailsObservable = this.orderService.getOrderDetailsById(this.orderId);
    const financialTransactionObservable =
      this.financialTransactionService.getFinancialTransactionByOrderId(this.orderId);
    const paymentHistoryObservable = this.paymentHistoryService.getPaymentHistoriesByOrderId(
      this.orderId,
    );
    forkJoin([orderDetailsObservable, financialTransactionObservable, paymentHistoryObservable])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([orderDetails, financialTransaction, paymentHistories]) => {
        this.isOrderDetailsCallComplete = true;
        this.orderDetails = orderDetails;
        this.financialTransactionDto = financialTransaction;
        this.paymentHistories = paymentHistories;
        this.mappedSubOrders = orderDetails.subOrders.map(subOrder => ({
          subOrder,
          product: orderDetails.products.find(product => product.id === subOrder.productId),
        }));
        this.isOrderEligibleForIVCR =
          financialTransaction?.accountingStatus === AccountingStatus.Posted &&
          this.orderDetails.order.orderType !== OrderType.SW &&
          this.orderDetails.order.orderStatus === OrderStatus.Complete;

        this.isEligibleForRefund =
          orderDetails.order.orderStatus === OrderStatus.Complete && !this.isOrderEligibleForIVCR;

        this.isEligibleForSWCROrder();
      });
  }

  refundPostedOrder() {
    this.orderService
      .placeRefundOrder(this.orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((x: OrderDto) => {
        this.router.navigateByUrl('/pos', {
          state: {
            orderId: x.id,
            action: OrderActionType.OpenOrderInOrderEntry,
          },
        });
      });
  }

  refundCompletedOrder() {
    this.sharedDataService.clearRefundOrderNotification();
    this.router.navigateByUrl('/pos', {
      state: {
        orderId: this.orderId,
        action: OrderActionType.OpenOrderInOrderEntry,
      },
    });
  }

  handleImageError(event: any) {
    event.target.src = this.defaultImageURL;
  }

  openReplacementDialog() {
    const dialogRef = this.dialog.open(OrderReplacementReasonDialogComponent, {
      width: '40%',
    });
    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: { replacementReasonId: string; additionalComment?: string }) => {
        if (result.replacementReasonId) {
          this.replacementOrder(result.replacementReasonId, result.additionalComment);
        }
      });
  }

  replacementOrder(replacementReasonId: string, additionalComment?: string) {
    const replacementOrderDto: ReplacementOrderDto = {
      replacementReasonValueId: replacementReasonId,
      additionalComment: additionalComment,
    };

    this.orderService
      .replacementOrder(this.orderId, replacementOrderDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.getOrderDetailsById();
      });
  }

  onReplacement() {
    this.router.navigateByUrl('/pos', {
      state: {
        orderId: this.orderId,
        action: OrderActionType.ReOrderForCancelledItem,
        orderType: OrderType.RP,
      },
    });
  }

  markProblematicDelivery(orderId: string) {
    this.confirmation
      .warn('::AreYouSureToMarkDeliveryProblem', '::AreYouSure')
      .subscribe(status => {
        if (status === Confirmation.Status.confirm) {
          this.orderService
            .updateOrderStatusForDeliveryProblem(orderId)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
              this.orderDetails.order.orderStatus = OrderStatus.Cancelled;
              this.toasterService.success('::OrderDetails:MarkOrdersDeliveryProblems');
            });
        }
      });
  }

  markOrderPaid(orderId: string) {
    this.confirmation
      .warn('::OrderDetails:AreYouSureToMarkPaid', '::AreYouSure')
      .subscribe(status => {
        if (status === Confirmation.Status.confirm) {
          this.orderService
            .updateOrderPaymentStatus(orderId)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
              this.orderDetails.order.paymentStatus = PaymentStatus.Paid;
              this.orderDetails.amountPaid = this.orderDetails.order.orderTotal;
              this.orderDetails.amountDue = 0;
              this.toasterService.success('::OrderDetails:MarkAsPaidSuccess');
            });
        }
      });
  }

  toggleSubOrderSelection(id: string) {
    const index = this.selectedSubOrderIds.indexOf(id);
    if (index > -1) {
      this.selectedSubOrderIds.splice(index, 1);
    } else {
      this.selectedSubOrderIds.push(id);
    }
    this.updateSelectAllState();
  }

  toggleSelectAll() {
    if (this.selectAll) {
      this.selectedSubOrderIds = this.mappedSubOrders
        .filter(
          item =>
            item.subOrder.deliveryCategory !== DeliveryCategory.CarryOut &&
            item.subOrder.deliveryStatus !== SubOrderDeliveryStatus.Delivered,
        )
        .map(item => item.subOrder.id);
    } else {
      this.selectedSubOrderIds = [];
    }
  }

  updateSelectAllState() {
    this.selectAll =
      this.selectedSubOrderIds.length === this.mappedSubOrders.length &&
      this.mappedSubOrders.length > 0;
  }

  openDeliveryDetailsDialogue() {
    if (this.selectedSubOrderIds.length === 0) {
      this.toasterService.error('::OrderDetails:NoSubOrderSelected');
      return;
    }

    const dialogRef = this.dialog.open(SubOrderDeliveryDetailsDialogComponent, {
      width: '50%',
      enterAnimationDuration: DIALOG_ENTER_ANIMATION_DURATION,
      data: { subOrderIds: this.selectedSubOrderIds, orderId: this.orderId },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.updatedSubOrderIds?.length) {
        this.updateDeliveryStatus(result.updatedSubOrderIds);
      }
    });
  }

  isShowDeliveredAndAllCheckBoxButton(): boolean {
    const hasNonCarryOut = this.mappedSubOrders?.some(
      item => item.subOrder.deliveryCategory !== DeliveryCategory.CarryOut,
    );
    const hasNotDelivered = this.mappedSubOrders?.some(
      item =>
        item.subOrder.deliveryStatus !== SubOrderDeliveryStatus.Delivered &&
        item.subOrder.deliveryCategory !== DeliveryCategory.CarryOut,
    );

    return hasNonCarryOut && hasNotDelivered;
  }

  isShowCheckbox(id: string): boolean {
    const matchedSubOrder = this.mappedSubOrders?.find(item => item.subOrder.id === id);
    const { deliveryCategory, deliveryStatus } = matchedSubOrder.subOrder;

    if (deliveryCategory === DeliveryCategory.CarryOut) return false;
    if (deliveryStatus === SubOrderDeliveryStatus.Delivered) return false;

    this.ignoredHighlightedSubOrderIds.push(id);
    return true;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateDeliveryStatus(deliveredSubOrderIds: string[]) {
    deliveredSubOrderIds.forEach(id => {
      const item = this.mappedSubOrders.find(x => x.subOrder.id === id);
      if (item) {
        item.subOrder.deliveryStatus = SubOrderDeliveryStatus.Delivered;
      }
    });

    this.selectedSubOrderIds = this.selectedSubOrderIds.filter(
      id => !deliveredSubOrderIds.includes(id),
    );
  }

  private isEligibleForSWCROrder() {
    const anyCashPayment = this.paymentHistories.some(c => c.paymentMethod === PaymentMethod.Cash);
    this.isOrderEligibleForSWCR =
      this.orderDetails.order.orderStatus === OrderStatus.Complete &&
      this.orderDetails.order.orderType === OrderType.SW &&
      anyCashPayment &&
      this.financialTransactionDto?.accountingStatus === AccountingStatus.Posted;
  }
}
