import { Component, Inject, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { SharedDataService } from '../shared-data.service';
import { OrderSummary } from '../models/order-summary.model';
import { MatSelectChange } from '@angular/material/select';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { PosGiftCardPaymentDetailsComponent } from './pos-gift-card-payment-details/pos-gift-card-payment-details.component';
import { ToasterService } from '@abp/ng.theme.shared';
import { GiftCardPayment } from '../models/gift-card-payment.model';
import { PaymentMethod } from '@proxy/payment';
import { CorporateSettingDto, CorporateSettingService } from '@proxy/corporate-settings';
import { PartialPaymentConfirmationComponent } from './partial-payment-confirmation/partial-payment-confirmation.component';
import { CustomerAccountType, CustomerDto } from '@proxy/customers';
import { PosPayment } from '../models/pos-payment.model';
import {
  DeliveryCategory,
  OrderDeliveryStatus,
  OrderService,
  OrderStatus,
  OrderType,
  PaymentStatus,
  UpdateOrderStatusDto,
} from '@proxy/orders';
import { Subject, takeUntil } from 'rxjs';
import { PaymentHistoryLookUpDto, PaymentHistoryService } from '@proxy/payment-histories';
import { PosPrintOrderDialogComponent } from '../pos-print-order-dialog/pos-print-order-dialog.component';
import { PosPrintService } from '@proxy/pos-printing';
import { OrderDataService } from '../order-data.service';
import { isDesignModuleNotApplicable } from 'src/app/shared/common-utils';

@Component({
  selector: 'app-pos-payment-details',
  templateUrl: './pos-payment-details.component.html',
  styleUrls: ['./pos-payment-details.component.scss'],
})
export class PosPaymentDetailsComponent implements OnInit, OnDestroy {
  posPayments: PosPayment[] = [];
  paymentMethodOptions: { value: number; text: string }[] = [];
  selectedPaymentOption: number = 0;
  totalPaidAmount: WritableSignal<number> = signal(0);
  remainingAmount: number;
  isPartialPaymentEligible: boolean = false;
  isDesignModuleActive: boolean = false;

  orderSummary: OrderSummary;
  giftCardPayment: GiftCardPayment;
  isGiftCardOrder: boolean;
  private customer: CustomerDto;
  private corporateSettings: WritableSignal<CorporateSettingDto> = signal(null);
  protected readonly PaymentMethod = PaymentMethod;
  destroy$: Subject<void> = new Subject();

  constructor(
    private readonly sharedDataService: SharedDataService,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toasterService: ToasterService,
    private corporateSettingService: CorporateSettingService,
    private orderService: OrderService,
    private paymentHistoryService: PaymentHistoryService,
    private posPrintOrderService: PosPrintOrderDialogComponent,
    private posPrintService: PosPrintService,
    private orderDataService: OrderDataService,
  ) {}

  ngOnInit(): void {
    this.isGiftCardOrder = this.data?.isGiftCardOrder;

    this.sharedDataService.orderSummary.pipe(takeUntil(this.destroy$)).subscribe(orderSummary => {
      this.orderSummary = orderSummary;
      this.remainingAmount = Number(orderSummary.amountDue || 0);
      if (orderSummary.orderId) {
        this.loadAllPaymentHistories(orderSummary.orderId);
      }
    });

    this.sharedDataService.giftCardPayment$.pipe(takeUntil(this.destroy$)).subscribe(giftCard => {
      if (!giftCard) return;
      this.giftCardPayment = giftCard;
    });

    this.customer = this.sharedDataService.getCustomer();
    this.paymentMethodOptions = this.getFilteredPaymentMethodOptions();

    this.corporateSettingService
      .getCorporateSetting()
      .pipe(takeUntil(this.destroy$))
      .subscribe(x => {
        this.corporateSettings.set(x);
      });

    this.corporateSettingService
      .isDesignModuleActive()
      .pipe(takeUntil(this.destroy$))
      .subscribe(isActive => {
        this.isDesignModuleActive = isActive;
      });
  }

  getFilteredPaymentMethodOptions(): { value: number; text: string }[] {
    return Object.entries(PaymentMethod)
      .filter(([key, value]) => {
        if (!isNaN(Number(key))) return false;

        const valueAsPaymentMethod = value as PaymentMethod;
        return this.isValidForOrderTypes(valueAsPaymentMethod);
      })
      .map(([key, value]) => ({
        value: value as number,
        text: key,
      }))
      .sort((a, b) => a.text.localeCompare(b.text));
  }

  private isValidForOrderTypes = (value: PaymentMethod): boolean => {
    if (this.isGiftCardOrder && value === PaymentMethod.GiftCard) return false;
    if (!this.customer?.id && value === PaymentMethod.Card) return false;
    if (this.orderSummary?.orderType === OrderType.SO && value === PaymentMethod.Cash) return false;
    if (this.orderSummary?.orderType === OrderType.PHO && value !== PaymentMethod.Card)
      return false;
    if (value === PaymentMethod.HouseAccount)
      return this.customer?.customerAccountType === CustomerAccountType.House;

    return true;
  };

  loadAllPaymentHistories(orderId: string) {
    this.paymentHistoryService
      .getPaymentHistoriesByOrderId(orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (paymentHistories: PaymentHistoryLookUpDto[]) => {
          this.posPayments = [];
          paymentHistories.forEach(x => {
            this.posPayments.push({
              paymentMethodId: x.paymentMethod,
              paymentMethodName: PaymentMethod[x.paymentMethod],
              amount: x.amountCharged,
              extraProperties: {
                cardNumber: x.giftCardNumber,
                checkNumber: x.checkNumber,
              },
            });
          });
        },
      });
  }

  onPaymentMethodSelect(event: MatSelectChange): void {
    if (event.value === PaymentMethod.Unpaid) {
      this.paymentMethodOptions = this.paymentMethodOptions.filter(option => {
        return option.value !== PaymentMethod.Unpaid && option.value !== PaymentMethod.HouseAccount;
      });

      this.addPosPayment({
        paymentMethodId: PaymentMethod.Unpaid,
        paymentMethodName: PaymentMethod[PaymentMethod.Unpaid],
        amount: undefined,
      });
    }
  }

  onAccept(paymentMethod: PaymentMethod, enteredAmount?: number) {
    this.addPosPayment({
      paymentMethodId: paymentMethod,
      paymentMethodName: PaymentMethod[paymentMethod],
      amount: enteredAmount,
    });

    if (paymentMethod === PaymentMethod.HouseAccount) {
      this.paymentMethodOptions = this.paymentMethodOptions.filter(option => {
        return option.value !== PaymentMethod.Unpaid && option.value !== PaymentMethod.HouseAccount;
      });
    }
  }

  onCheckAccept(
    paymentMethod: PaymentMethod,
    data: { enteredAmount: number; checkNumber: string },
  ) {
    this.addPosPayment({
      paymentMethodId: paymentMethod,
      paymentMethodName: PaymentMethod[paymentMethod],
      amount: data.enteredAmount,
      extraProperties: {
        checkNumber: data.checkNumber,
      },
    });
  }

  onGiftCardAccept(
    paymentMethod: PaymentMethod,
    data: { enteredAmount: number; cardNumber: string },
  ) {
    this.addPosPayment({
      paymentMethodId: paymentMethod,
      paymentMethodName: PaymentMethod[paymentMethod],
      amount: data.enteredAmount,
      extraProperties: {
        cardNumber: data.cardNumber,
      },
    });
  }

  getUsedGiftCardList(cardNumber: string): void {
    this.dialog.open(PosGiftCardPaymentDetailsComponent, {
      width: '800px',
      height: 'auto',
      data: { cardNumber },
    });
  }

  confirmPayment(): void {
    const isAllSubOrderCarryOut = this.orderSummary.subOrderItems.every(
      x => x.deliveryCategory === DeliveryCategory.CarryOut,
    );

    if (isAllSubOrderCarryOut && this.remainingAmount > 0) {
      this.toasterService.error('::Pos:Payment:NotEligibleForPartialPaymentErrorMessage');
      return;
    }

    if (this.remainingAmount === 0) {
      this.savePaymentData();
      return;
    }

    this.isPartialPaymentEligible =
      this.remainingAmount > 0 && this.corporateSettings()?.allowPartialPayment;

    if (!this.isPartialPaymentEligible) {
      this.toasterService.error('::Pos:Payment:NotEligibleForPartialPaymentErrorMessage');
      return;
    }

    if (this.isPartialPaymentEligible) {
      const dialogRef = this.dialog.open(PartialPaymentConfirmationComponent, {
        width: '50%',
      });
      dialogRef
        .afterClosed()
        .pipe(takeUntil(this.destroy$))
        .subscribe(result => {
          if (result.isPartialPaymentConfirmed) {
            this.savePaymentData();
          }
        });
    }
  }

  savePaymentData() {
    const isAllSubOrderCarryOut = this.orderSummary.subOrderItems.every(
      x => x.deliveryCategory === DeliveryCategory.CarryOut,
    );

    let paymentStatus = PaymentStatus.Paid;
    const orderType = this.orderSummary?.orderType;
    if (this.isPartialPaymentEligible) paymentStatus = PaymentStatus.Partial;
    if (
      this.isPartialPaymentEligible &&
      Number(this.orderSummary?.amountDue) === this.orderSummary?.amountPayable
    )
      paymentStatus = PaymentStatus.Unpaid;

    let orderStatus = this.orderSummary.reviewType ? OrderStatus.Review : OrderStatus.InProgress;

    if (
      isAllSubOrderCarryOut &&
      paymentStatus === PaymentStatus.Paid &&
      (!this.isDesignModuleActive || isDesignModuleNotApplicable(orderType))
    )
      orderStatus = OrderStatus.Complete;

    let deliveryStatus = OrderDeliveryStatus.ToBeDelivered;

    if (isAllSubOrderCarryOut && paymentStatus === PaymentStatus.Paid)
      deliveryStatus = OrderDeliveryStatus.Delivered;

    const updateOrderStatusDto: UpdateOrderStatusDto = {
      orderStatus: orderStatus,
      paymentStatus: paymentStatus,
      deliveryStatus: deliveryStatus,
      changeDueAmount: Number(this.orderSummary?.changeDue),
    };

    this.orderService
      .updateOrderStatus(this.orderSummary.orderId, updateOrderStatusDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const orderId = this.orderSummary?.orderId;
        this.orderDataService.printOrder(this.orderSummary, orderStatus);
        this.toasterService.success('::Pos:Order:SuccessMessage');
        this.sharedDataService.clearPos();
        this.sharedDataService.clearTip();
        this.dialog.closeAll();

        this.printPOSReceipt(orderId, orderType);
      });
  }

  private printPOSReceipt(orderId: string, orderType: OrderType) {
    switch (orderType) {
      case OrderType.SW:
        this.posPrintService
          .getPosPrintDataList(orderId)
          .subscribe(subOrderList => this.posPrintOrderService.generatePOSReceipt(subOrderList));
        break;
      case OrderType.IV:
        this.posPrintOrderService.handleCustomerCopy(orderId);
        break;
      default:
        break;
    }
  }

  private addPosPayment(posPayment: PosPayment) {
    this.posPayments.push(posPayment);
    if (posPayment.paymentMethodId !== PaymentMethod.Unpaid) {
      this.totalPaidAmount.update(amount => amount + posPayment.amount);
    }
    this.updateUnpaidBalance();
    setTimeout(() => {
      this.selectedPaymentOption = 0;
    });
  }

  private updateUnpaidBalance() {
    const unpaidIndex = this.posPayments.findIndex(e => e.paymentMethodId === PaymentMethod.Unpaid);
    if (unpaidIndex >= 0) {
      this.posPayments[unpaidIndex] = {
        ...this.posPayments[unpaidIndex],
        amount: this.remainingAmount,
      };

      if (!this.remainingAmount) {
        this.posPayments = this.posPayments.filter((_, index) => index !== unpaidIndex);
      }
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
