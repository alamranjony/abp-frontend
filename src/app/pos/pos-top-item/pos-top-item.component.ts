import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PosGiftCardCheckBalanceComponent } from '../pos-gift-card-check-balance/pos-gift-card-check-balance.component';
import { DIALOG_ENTER_ANIMATION_DURATION } from 'src/app/shared/dialog.constants';
import { PosOpeningBalanceComponent } from '../pos-opening-balance/pos-opening-balance.component';
import { PosOrderNotepadComponent } from '../pos-order-notepad/pos-order-notepad.component';
import { Router } from '@angular/router';
import { SharedDataService } from '../shared-data.service';
import {
  CancelOrderDto,
  CreateUpdateOrderDto,
  CreateUpdateSubOrderDto,
  OrderDeliveryStatus,
  OrderService,
  OrderStatus,
  OrderType,
  PaymentStatus,
  SubOrderDeliveryStatus,
} from '@proxy/orders';
import { OrderSummary } from '../models/order-summary.model';
import { ToasterService } from '@abp/ng.theme.shared';
import { EmployeeService } from '@proxy/employees';
import { PosMiscOrderComponent } from '../pos-misc-order/pos-misc-order.component';
import { ProductCategoryType } from '@proxy/products';
import { Subject, takeUntil } from 'rxjs';
import { SubOrderItem } from '../models/sub-order-Item.model';
import { PosCancelReasonDialogComponent } from '../pos-cancel-reason-dialog/pos-cancel-reason-dialog.component';
import { RejectOrderMessageComponent } from 'src/app/reject-order-message/reject-order-message.component';
import { PosPrintOrderDialogComponent } from '../pos-print-order-dialog/pos-print-order-dialog.component';

@Component({
  selector: 'app-pos-top-item',
  templateUrl: './pos-top-item.component.html',
  styleUrl: './pos-top-item.component.scss',
})
export class PosTopItemComponent implements OnInit, OnDestroy {
  menuItems = [
    { icon: 'close', title: 'Cancel Sale', id: 1, permission: 'ClientPortal.Orders.CancelOrder' },
    { icon: 'block', title: 'Hold Sale', id: 2, permission: 'ClientPortal.Orders.HoldOrder' },
    { icon: 'cancel', title: 'Reject Order', id: 3, permission: 'ClientPortal.Orders.RejectOrder' },
    {
      icon: 'add_circle',
      title: 'Add New Item',
      id: 4,
      permission: 'ClientPortal.Products.CreateAndEdit',
    },
    { icon: 'note_add', title: 'Notepad', id: 5, permission: 'ClientPortal.Orders.ViewNotepad' },
    { icon: 'print', title: 'Print', id: 6, permission: 'ClientPortal.Orders.PrintOrderAndCards' },
    {
      icon: 'check_circle',
      title: 'Confirm Delivery',
      id: 7,
      permission: 'ClientPortal.Orders.ConfirmDelivery',
    },
    {
      icon: 'account_balance_wallet',
      title: 'Opening Balance',
      id: 8,
      permission: 'ClientPortal.Orders.OpeningBalance',
    },
    {
      icon: 'assured_workload',
      title: 'Check Balance',
      id: 9,
      permission: 'ClientPortal.Orders.CheckGiftCardBalance',
    },
    {
      icon: 'workspaces',
      title: 'Will Call Queue',
      id: 10,
      permission: 'ClientPortal.Orders.WillCallQueue',
    },
    { icon: 'category', title: 'Misc Order', id: 11, permission: 'ClientPortal.Orders.MiscOrder' },
  ];

  orderSummary: OrderSummary;
  noAddedSubOrderItemsInPos: boolean = false;
  employeeId: string;
  isGenericUser: boolean;
  destroy$: Subject<void> = new Subject();

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private sharedDataService: SharedDataService,
    private orderService: OrderService,
    private toasterService: ToasterService,
    private employeeService: EmployeeService,
  ) {}

  ngOnInit(): void {
    this.sharedDataService.orderSummary.pipe(takeUntil(this.destroy$)).subscribe(orderSummary => {
      this.orderSummary = orderSummary;
      this.noAddedSubOrderItemsInPos = orderSummary.subOrderItems.length === 0;
      this.employeeId = orderSummary.employeeId;
      if (this.employeeId) this.isGenericUser = true;
    });
  }

  handleMenuItemClick(id: number): void {
    switch (id) {
      case 11:
        this.openMiscOrderDialog();
        break;
      case 10:
        this.router.navigateByUrl('/order-control-list', { state: { isWillCall: true } });
        break;
      case 9:
        this.openGiftCardBalanceDialog();
        break;
      case 8:
        this.openOpeningBalanceDialog();
        break;
      case 7:
        this.router.navigateByUrl('/order-control-list', { state: { isConfirmDelivery: true } });
        break;
      case 6:
        this.openPrintDialog();
        break;
      case 5:
        this.openOrderNotepadDialog();
        break;
      case 4:
        this.createNewProduct();
        break;
      case 3:
        this.openRejectOrderDialog();
        break;
      case 2:
        this.putOrderOnHold();
        break;
      case 1:
        this.changeOrderStatusToCancel();
        break;
      default:
        break;
    }
  }

  openGiftCardBalanceDialog() {
    this.dialog.open(PosGiftCardCheckBalanceComponent, {
      width: '50%',
      enterAnimationDuration: DIALOG_ENTER_ANIMATION_DURATION,
    });
  }

  openOpeningBalanceDialog() {
    this.employeeService
      .isGenericUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe(isGenericUser => {
        if (isGenericUser && !this.employeeId)
          this.toasterService.error('::Pos:OpeningBalanceEmployeeIdAdd');
        else {
          this.dialog.open(PosOpeningBalanceComponent, {
            width: '50%',
            enterAnimationDuration: DIALOG_ENTER_ANIMATION_DURATION,
            data: { employeeId: this.employeeId },
          });
        }
      });
  }

  openOrderNotepadDialog() {
    this.dialog.open(PosOrderNotepadComponent, {
      width: '50%',
      height: '50%',
      enterAnimationDuration: DIALOG_ENTER_ANIMATION_DURATION,
    });
  }

  openPrintDialog() {
    if (this.orderSummary?.subOrderItems.length) {
      this.dialog.open(PosPrintOrderDialogComponent, {
        width: '50%',
        height: 'auto',
        enterAnimationDuration: DIALOG_ENTER_ANIMATION_DURATION,
        data: { orderId: this.orderSummary?.orderId },
      });
    } else this.toasterService.error('::PrintOptions:NoOrderSelected');
  }

  openMiscOrderDialog() {
    this.dialog.open(PosMiscOrderComponent, {
      width: '50%',
      enterAnimationDuration: DIALOG_ENTER_ANIMATION_DURATION,
    });
  }

  openRejectOrderDialog() {
    if (this.orderSummary?.orderType === OrderType.WI) {
      this.dialog.open(RejectOrderMessageComponent, {
        width: '50%',
        height: '30%',
        enterAnimationDuration: DIALOG_ENTER_ANIMATION_DURATION,
        data: { orderId: this.orderSummary?.orderId },
      });
    }
  }

  createNewProduct() {
    this.router.navigate(['products/create']);
  }

  changeOrderStatusToCancel() {
    const dialogRef = this.dialog.open(PosCancelReasonDialogComponent, {
      width: '40%',
    });
    dialogRef
      .afterClosed()
      .subscribe((result: { cancelReasonId: string; additionalComment?: string }) => {
        if (result.cancelReasonId) {
          const cancelOrderDto: CancelOrderDto = {
            orderStatus: OrderStatus.Cancelled,
            cancelSaleReasonValueId: result.cancelReasonId,
            additionalComment: result.additionalComment,
          };

          if (
            (this.orderSummary.orderStatus === OrderStatus.InProgress ||
              this.orderSummary.orderStatus === OrderStatus.Complete) &&
            Number(this.orderSummary.amountPaid) > 0
          ) {
            this.sharedDataService.sendRefundOrderNotification(cancelOrderDto);
          } else this.cancelOrder(cancelOrderDto);
        }
      });
  }

  private putOrderOnHold() {
    this.saveOrder();
  }

  private saveOrder() {
    if (this.noAddedSubOrderItemsInPos) return;

    const createUpdateSubOrderDtos: CreateUpdateSubOrderDto[] = [];
    const isGiftCardOrder = this.orderSummary.subOrderItems.some(
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
      orderStatus: OrderStatus.Hold,
      paymentStatus: PaymentStatus.Unpaid,
      deliveryStatus: OrderDeliveryStatus.ToBeDelivered,
      reviewType: this.orderSummary.reviewType,
      createUpdateSubOrderDtos: createUpdateSubOrderDtos,
      isGiftCardOrder: isGiftCardOrder,
      assignedUserId: null,
    };

    this.orderService
      .update(this.orderSummary.orderId, updateOrderDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toasterService.success('::Pos:OrderIsOnHold');
          this.sharedDataService.clearPos();
        },
        error: () => {
          this.toasterService.error('::Pos:OrderUpdateFailed');
        },
      });
  }

  private cancelOrder(cancelOrderDto: CancelOrderDto) {
    if (this.noAddedSubOrderItemsInPos) return;

    this.orderService
      .cancelOrder(this.orderSummary.orderId, cancelOrderDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toasterService.success('::Pos:OrderStatus.Cancel');
          this.sharedDataService.clearPos();
        },
        error: () => {},
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
