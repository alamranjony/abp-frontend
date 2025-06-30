import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ProductItem } from '../products/product.model';
import { OrderSummary } from './models/order-summary.model';
import { DiscountApplicationType, DiscountDto, DiscountType } from '@proxy/discounts';
import { SubOrderItem } from './models/sub-order-Item.model';
import { CustomerDto } from '@proxy/customers';
import { GiftCardPayment } from './models/gift-card-payment.model';
import { DecimalPipe } from '@angular/common';
import {
  CancelOrderDto,
  DeliveryCategory,
  OrderStatus,
  OrderType,
  ReviewType,
} from '@proxy/orders';
import { AbpLocalStorageService } from '@abp/ng.core';
import { OrderItem } from './models/order-item.model';
import { CorporateSettingDto } from '@proxy/corporate-settings';
import { FormGroup } from '@angular/forms';

@Injectable({ providedIn: 'root' })
export class SharedDataService {
  private currentProducts$ = new BehaviorSubject<ProductItem[]>([]);
  currentProducts = this.currentProducts$.asObservable();

  private currentProduct$ = new BehaviorSubject<ProductItem>(null);
  currentProduct = this.currentProduct$.asObservable();

  private paymentMade = new BehaviorSubject<boolean>(null);
  paymentMade$ = this.paymentMade.asObservable();

  private refundOrder = new BehaviorSubject<CancelOrderDto>(null);
  refundOrder$ = this.refundOrder.asObservable();

  private reOrderPlaced = new BehaviorSubject<boolean>(false);
  reOrderPlaced$ = this.reOrderPlaced.asObservable();

  private recipientAddedSubject = new BehaviorSubject<boolean>(false);
  recipientAdded$ = this.recipientAddedSubject.asObservable();

  private recipientAddedData = new BehaviorSubject<any>(null);
  recipientData$ = this.recipientAddedData.asObservable();

  private subOrderItemData = new BehaviorSubject<SubOrderItem>(null);
  subOrderItem$ = this.subOrderItemData.asObservable();

  private discountCodeClear = new BehaviorSubject<void>(null);
  discountCodeClear$ = this.discountCodeClear.asObservable();

  private selectedSubOrderIds = new BehaviorSubject<string[]>([]);
  selectedSubOrderIds$ = this.selectedSubOrderIds.asObservable();

  private orderSummary$ = new BehaviorSubject<OrderSummary>({
    totalSubOrdersCount: 0,
    subTotal: 0,
    total: 0,
    totalDiscountOnItems: 0,
    totalDiscountOnOrder: 0,
    totalDiscountOnDeliveryFee: 0,
    totalDiscount: 0,
    totalOrderItems: 0,
    deliveryFeeTotal: 0,
    isDeliveryFeeTotalReduced: false,
    amountPayable: 0,
    appliedDiscountCodeId: undefined,
    tipAmount: 0,
    tipValueTypeId: null,
    totalAmount: 0,
    subOrderItems: [],
    masterRecipient: undefined,
    taxAmount: 0,
    orderId: undefined,
    amountDue: '0.00',
    amountPaid: '0.00',
    changeDue: '0.00',
    isTotalAmountPaid: false,
    orderType: OrderType.SW,
    orderStatus: OrderStatus.Abandoned,
    reviewType: undefined,
    savedDeliveryFeeTotal: 0,
  });

  orderSummary = this.orderSummary$.asObservable();

  private deliveryFeeTotal: number = 0;
  private totalDiscount: number = 0;
  private totalDiscountOnItems: number = 0;
  private totalDiscountOnOrder: number = 0;
  private totalDiscountOnDeliveryFee: number = 0;
  private totalDiscountOnCustomer: number = 0;

  isDeliveryFeeManuallySet: boolean = false;
  private addedSubOrderItems: SubOrderItem[] = [];
  private amountPayable: number = 0;
  private subTotal: number = 0;
  private appliedDiscount: DiscountDto;
  private customer?: CustomerDto;
  private total: number = 0;
  private tipAmount: number = 0;
  private tipValueTypeId: string | null = null;
  private tipType: string | null = null;
  private orderId: string;
  private orderType: OrderType = OrderType.SW;
  private orderStatus: OrderStatus = OrderStatus.Abandoned;
  private reviewType: ReviewType = undefined;
  private amountDue: string = '0.00';
  private amountPaid: string = '0.00';
  private changeDue: string = '0.00';
  private employeeId: string;
  private corporateSalesTax: number = 0;
  private orderEntryMode: 'new' | 'edit' = 'new';

  private cartTotalAmount = new BehaviorSubject<number>(0);
  cartTotalAmount$ = this.cartTotalAmount.asObservable();

  private giftCardPayment = new BehaviorSubject<GiftCardPayment>({
    giftCardTotalAmount: 0,
    giftCardPaymentDtos: [],
  });
  giftCardPayment$ = this.giftCardPayment.asObservable();

  private orderNumber = new BehaviorSubject<number>(0);
  orderNumber$ = this.orderNumber.asObservable();

  private tipAppliedSubject = new BehaviorSubject<boolean>(false);
  tipApplied$ = this.tipAppliedSubject.asObservable();

  private taxAmount: number;
  private customerId: string;
  private parentOrderId: string;
  private savedDeliveryFeeTotal: number;

  private resetOrderTypeAction = new Subject<boolean>();
  resetOrderTypeAction$ = this.resetOrderTypeAction.asObservable();

  corporateSettings: CorporateSettingDto;

  constructor(
    private decimalPipe: DecimalPipe,
    private localStorageService: AbpLocalStorageService,
  ) {}

  sendReOrderPlacedNotification() {
    this.reOrderPlaced.next(true);
  }

  sendRefundOrderNotification(cancelOrderDto?: CancelOrderDto) {
    this.refundOrder.next(cancelOrderDto);
  }
  clearRefundOrderNotification() {
    this.refundOrder.next(null);
  }

  addProduct(product: ProductItem) {
    this.currentProduct$.next(product);
  }

  getCustomer() {
    return this.customer;
  }

  addProducts(products: ProductItem[]) {
    this.currentProducts$.next(products);
  }

  addCustomer(customer: CustomerDto) {
    this.customer = customer;

    let customerDiscount = this.subTotal * (this.customer?.discount / 100);

    if (isNaN(customerDiscount) || customerDiscount < this.totalDiscount) {
      this.broadcastOrderSummary();
      return;
    }
    this.calculateDeliveryCharge();
    this.applyDiscountCode(customerDiscount, undefined);
  }

  deleteCustomer() {
    if (this.customer?.hasDeliveryCharge) this.customer.hasDeliveryCharge = false;
    this.calculateDeliveryCharge(true);
  }

  clearProducts() {
    this.currentProducts$.next([]);
    this.addedSubOrderItems = [];
    this.broadcastOrderSummary();
  }

  setOrderId(orderId: string) {
    this.orderId = orderId;
  }

  shareOrderSummary(orderSummary: OrderSummary): void {
    this.orderSummary$.next(orderSummary);
  }

  broadcastOrderSummary(): void {
    this.shareOrderSummary(this.prepareOrderSummary(this.addedSubOrderItems));
  }

  prepareOrderSummary(addedSubOrderItems: SubOrderItem[]): OrderSummary {
    this.addedSubOrderItems = addedSubOrderItems;
    let subTotal = 0;
    let totalDiscountOnItem = 0;
    let totalDeliveryFeeOnOrder = 0;

    addedSubOrderItems.forEach(item => {
      subTotal = subTotal + item.subTotal;
      let discountTotal = 0;
      if (item.discountType === DiscountType.Amount) {
        totalDiscountOnItem += item.itemSpecificDiscount;
        discountTotal = item.itemSpecificDiscount;
      }
      if (item.discountType === DiscountType.Percentage) {
        totalDiscountOnItem += item.subTotal * (item.itemSpecificDiscount / 100);
        discountTotal = (item.subTotal * item.itemSpecificDiscount) / 100;
      }
      totalDeliveryFeeOnOrder += item.deliveryFee;

      if (
        this.totalDiscount > 0 &&
        (this.appliedDiscount?.discountApplicationType == DiscountApplicationType.Order ||
          this.appliedDiscount?.discountApplicationType == DiscountApplicationType.DeliveryFee)
      ) {
        this.calculateDiscountForSubOrders(item);
      }

      if (!this.appliedDiscount && item.discountAmount > 0) {
        item.discountAmount = discountTotal;
      }
    });

    this.subTotal = Number(this.toFixed(subTotal));
    this.total = subTotal + this.deliveryFeeTotal + this.tipAmount;
    this.totalDiscountOnItems = totalDiscountOnItem;
    this.calculateDeliveryCharge();
    this.calculateDiscounts(this.totalDiscount, this.appliedDiscount);
    this.calculateTaxAmount();
    this.calculateTotalPayableAmount();

    let amountDue = Math.max(0, this.amountPayable - Number(this.amountPaid));
    this.amountDue = this.toFixed(amountDue);

    let changeDue =
      Number(this.amountPaid) > Number(this.amountPayable)
        ? Number(this.amountPaid) - Number(this.amountPayable)
        : 0;
    this.changeDue = this.toFixed(changeDue);

    let orderSummary: OrderSummary = {
      totalSubOrdersCount: addedSubOrderItems.length,
      subTotal: this.subTotal,
      total: this.total,
      totalDiscountOnItems: totalDiscountOnItem,
      totalDiscountOnOrder: this.totalDiscountOnOrder,
      totalDiscountOnDeliveryFee: this.totalDiscountOnDeliveryFee,
      totalDiscount: this.totalDiscount,
      totalOrderItems: addedSubOrderItems.length,
      discountApplicationType:
        this.totalDiscountOnCustomer === 0
          ? this.appliedDiscount?.discountApplicationType
          : DiscountApplicationType.Customer,
      deliveryFeeTotal: this.deliveryFeeTotal,
      amountPayable: this.amountPayable,
      amountPaid: this.amountPaid,
      appliedDiscountCodeId: this.appliedDiscount?.id,
      totalAmount: 0,
      subOrderItems: this.addedSubOrderItems,
      masterRecipient: undefined,
      taxAmount: this.taxAmount,
      tipAmount: this.tipAmount,
      orderId: this.orderId,
      customer: this.customer,
      amountDue: this.amountDue,
      changeDue: this.changeDue,
      isTotalAmountPaid: this.toFixed(this.amountPayable) === this.amountPaid,
      orderType: this.orderType,
      orderStatus: this.orderStatus,
      reviewType: this.reviewType,
      employeeId: this.employeeId,
      customerId: this.customerId,
      orderEntryMode: this.orderEntryMode,
      savedDeliveryFeeTotal: this.savedDeliveryFeeTotal,
      parentOrderId: this.parentOrderId,
      tipValueTypeId: this.tipValueTypeId,
      tipType: this.tipType,
    };

    return orderSummary;
  }

  updateDeliveryFeeManually(deliveryFee: number) {
    this.deliveryFeeTotal = deliveryFee;
    this.isDeliveryFeeManuallySet = true;
    let orderSummary = this.prepareOrderSummary(this.addedSubOrderItems);
    this.shareOrderSummary(orderSummary);
  }

  applyDiscountCode(discountAmount: number, appliedDiscount: DiscountDto) {
    this.totalDiscount = Number(this.toFixed(discountAmount));
    this.appliedDiscount = appliedDiscount;

    if (
      this.totalDiscount > 0 &&
      (this.appliedDiscount?.discountApplicationType == DiscountApplicationType.Order ||
        this.appliedDiscount?.discountApplicationType == DiscountApplicationType.DeliveryFee ||
        this.customer?.discount)
    ) {
      this.addedSubOrderItems.forEach(item => {
        if (this.customer?.discount)
          item.discountAmount = Number(
            (this.totalDiscount / this.addedSubOrderItems.length).toFixed(2),
          );
        else this.calculateDiscountForSubOrders(item);
      });
    }

    let orderSummary = this.prepareOrderSummary(this.addedSubOrderItems);
    this.shareOrderSummary(orderSummary);
  }

  calculateDiscountForSubOrders(subOrderItem: SubOrderItem) {
    if (this.appliedDiscount.discountType == DiscountType.Percentage) {
      subOrderItem.discountAmount =
        this.appliedDiscount.discountApplicationType == DiscountApplicationType.Order
          ? ((subOrderItem.subTotal + subOrderItem.deliveryFee) *
              this.appliedDiscount.discountAmount) /
            100
          : (subOrderItem.deliveryFee * this.appliedDiscount.discountAmount) / 100;
    }
    if (this.appliedDiscount.discountType == DiscountType.Amount) {
      const amount = this.appliedDiscount.discountAmount / this.addedSubOrderItems.length;
      subOrderItem.discountAmount = Number(this.toFixed(amount));
    }

    subOrderItem.discountId = this.appliedDiscount.id;
  }

  clearDiscount() {
    this.totalDiscount = 0;
    this.appliedDiscount = null;

    this.totalDiscountOnOrder = 0;
    this.totalDiscountOnItems = 0;
    this.totalDiscountOnDeliveryFee = 0;
    this.totalDiscountOnCustomer = 0;

    this.addedSubOrderItems.forEach(item => {
      item.discountId = null;
    });

    let orderSummary = this.prepareOrderSummary(this.addedSubOrderItems);
    this.discountCodeClear.next();
    this.shareOrderSummary(orderSummary);
  }

  calculateDiscounts(discountAmount: number, appliedDiscount: DiscountDto) {
    discountAmount = this.getDiscountedAmount(appliedDiscount);

    let totalDiscountOnOrder = 0;
    let totalDiscountOnItems = 0;
    let totalDiscountOnDeliveryFee = 0;

    if (appliedDiscount?.discountApplicationType === DiscountApplicationType.Order) {
      totalDiscountOnOrder = discountAmount <= this.total ? discountAmount : 0;
    }

    if (appliedDiscount?.discountApplicationType === DiscountApplicationType.Item) {
      totalDiscountOnItems = discountAmount <= this.subTotal ? discountAmount : 0;
    }

    if (appliedDiscount?.discountApplicationType === DiscountApplicationType.DeliveryFee) {
      totalDiscountOnDeliveryFee = discountAmount <= this.deliveryFeeTotal ? discountAmount : 0;
    }

    if (!appliedDiscount) {
      totalDiscountOnItems = discountAmount;
    }

    this.totalDiscount = Number(this.toFixed(discountAmount));
    this.totalDiscountOnOrder = totalDiscountOnOrder;
    this.totalDiscountOnItems = totalDiscountOnItems;
    this.totalDiscountOnDeliveryFee = totalDiscountOnDeliveryFee;
    this.applyCustomerDiscount();
  }

  private applyCustomerDiscount() {
    let customerDiscount = 0;
    if (this.customer) {
      customerDiscount = this.subTotal * (this.customer.discount / 100);
    }

    if (customerDiscount >= this.subTotal) customerDiscount = 0;
    if (customerDiscount > this.totalDiscount) {
      this.totalDiscount = Number(this.toFixed(customerDiscount));
      this.totalDiscountOnCustomer = customerDiscount;
      this.totalDiscountOnOrder = 0;
      this.totalDiscountOnItems = 0;
      this.totalDiscountOnDeliveryFee = 0;
      this.appliedDiscount = undefined;

      this.addedSubOrderItems.forEach(item => {
        item.discountAmount = Number(
          this.toFixed(this.totalDiscount / this.addedSubOrderItems.length),
        );
        item.discountId = null;
        item.discountCode = '';
        item.discountType = null;
        item.itemSpecificDiscount = 0;
      });
    }
  }

  isDiscountCodeEligibleToApply(discountAmount: number) {
    if (!this.customer) return true;
    return discountAmount >= this.customer.discount;
  }

  getDiscountedAmount(appliedDiscountCode: DiscountDto) {
    let totalDiscount = 0;
    if (!appliedDiscountCode) {
      return this.totalDiscountOnItems;
    }
    if (appliedDiscountCode?.discountApplicationType === DiscountApplicationType.DeliveryFee) {
      if (appliedDiscountCode.discountType === DiscountType.Amount)
        totalDiscount = appliedDiscountCode.discountAmount;
      if (appliedDiscountCode?.discountType === DiscountType.Percentage)
        totalDiscount = this.deliveryFeeTotal * (appliedDiscountCode.discountAmount / 100);
    } else if (appliedDiscountCode?.discountApplicationType === DiscountApplicationType.Item) {
      if (appliedDiscountCode.discountType === DiscountType.Amount)
        totalDiscount = appliedDiscountCode.discountAmount;
      if (appliedDiscountCode?.discountType === DiscountType.Percentage)
        totalDiscount = this.deliveryFeeTotal * (appliedDiscountCode.discountAmount / 100);
    } else {
      if (appliedDiscountCode?.discountType === DiscountType.Amount)
        totalDiscount = appliedDiscountCode.discountAmount;
      if (appliedDiscountCode?.discountType === DiscountType.Percentage)
        totalDiscount =
          (this.subTotal + this.deliveryFeeTotal) * (appliedDiscountCode.discountAmount / 100);
    }
    return totalDiscount;
  }

  applyTip(tipAmount: number, tipValueTypeId?: string) {
    this.tipAmount = Number(this.toFixed(tipAmount));
    this.tipValueTypeId = tipValueTypeId;
    this.tipAppliedSubject.next(true);
    this.broadcastOrderSummary();
  }

  clearTip() {
    this.applyTip(0, null);
    this.tipAppliedSubject.next(false);
  }

  updateGiftCardPayment = (giftCardPayment: GiftCardPayment) =>
    this.giftCardPayment.next(giftCardPayment);

  updateCartTotalAmount = (amount: number) => this.cartTotalAmount.next(amount);

  private calculateTotalPayableAmount() {
    let amountPayable =
      this.subTotal + this.deliveryFeeTotal + this.taxAmount + this.tipAmount - this.totalDiscount;
    this.amountPayable = Number(this.toFixed(amountPayable));
  }

  setdeliveryFee(deliveryFee: number) {
    this.deliveryFeeTotal = deliveryFee;
  }

  addOrderNumber = (orderNumber: number) => this.orderNumber.next(orderNumber);

  calculatePaidAmount(paidAmount: number | string) {
    const amountPaid = Number(this.amountPaid) + Number(paidAmount);
    this.amountPaid = this.toFixed(amountPaid);
  }

  toFixed(value: number): string {
    const valueInString = this.decimalPipe.transform(value, '1.2-2');

    if (valueInString !== undefined && valueInString !== null)
      return valueInString.replace(/,/g, '');

    return '';
  }

  updateOrderType(orderType: OrderType) {
    this.orderType = orderType;
  }

  resetInvoiceTypeOrderSelection() {
    if (this.orderType === OrderType.IV) this.orderType = OrderType.SW;
  }

  updateReviewType(reviewType: ReviewType) {
    this.reviewType = reviewType;
  }

  clearPos() {
    this.deliveryFeeTotal = 0;
    this.totalDiscount = 0;
    this.totalDiscountOnItems = 0;
    this.totalDiscountOnOrder = 0;
    this.totalDiscountOnDeliveryFee = 0;
    this.totalDiscountOnCustomer = 0;

    this.isDeliveryFeeManuallySet = false;
    this.addedSubOrderItems = [];
    this.amountPayable = 0;
    this.subTotal = 0;
    this.appliedDiscount = undefined;
    this.customer = undefined;
    this.total = 0;
    this.taxAmount = 0;
    this.tipAmount = 0;
    this.tipValueTypeId = null;
    this.orderId = undefined;
    this.orderType = OrderType.SW;
    this.reviewType = undefined;
    this.amountDue = '0.00';
    this.amountPaid = '0.00';
    this.changeDue = '0.00';
    this.parentOrderId = null;
    this.localStorageService.removeItem('customer');
    this.paymentMade.next(true);
    this.refundOrder.next(null);
    this.addProduct(null);
    this.updateGiftCardPayment({
      giftCardTotalAmount: 0,
      giftCardPaymentDtos: [],
    });
    this.clearDiscount();
    this.broadcastOrderSummary();
  }

  clearOrderAction() {
    this.resetOrderTypeAction.next(true);
  }

  setCorporateSettings(settings: CorporateSettingDto) {
    this.corporateSettings = settings;
  }

  bindCorporateSelectedCountry(form: FormGroup, countryControlName: string = 'countryId') {
    if (!form || !this.corporateSettings) return;

    const selectedCountryId = this.corporateSettings?.countryId;

    const control = form.get(countryControlName);
    if (!control) return;

    control.setValue(selectedCountryId);
  }

  calculateTaxAmount() {
    if (!this.corporateSettings?.taxOnBusinessLocation || this.customer?.taxExempt) {
      this.resetTaxAmount();
      return;
    }

    let taxAmount = 0;
    this.addedSubOrderItems.forEach(item => {
      const { productItem, zoneSaleTax, subTotal, deliveryFee, discountAmount } = item;
      const taxRate = (zoneSaleTax || this.corporateSalesTax) / 100;
      const applyDeliveryTax = this.corporateSettings?.taxOnDelivery;

      let salesTax = 0;

      if (this.corporateSettings?.taxOnMerchandise && !productItem?.isNonTaxable) {
        salesTax += taxRate * (subTotal - discountAmount);
      }

      if (applyDeliveryTax) {
        salesTax += taxRate * (deliveryFee || 0);
      }

      item.salesTax = Number(salesTax.toFixed(2));
      taxAmount += item.salesTax;
    });

    this.taxAmount = Number(this.toFixed(taxAmount));
  }

  resetTaxAmount() {
    this.taxAmount = 0;
    this.addedSubOrderItems.forEach(item => (item.salesTax = 0));
  }

  setEmployeeId(employeeId: string) {
    this.employeeId = employeeId;
  }

  setCorporateSalesTax(taxAmount: number) {
    this.corporateSalesTax = Number(this.toFixed(taxAmount));
  }

  private calculateDeliveryCharge(hasDeletedCustomer: boolean = false) {
    if (hasDeletedCustomer) {
      this.addedSubOrderItems.map(subOrder => {
        if (subOrder.recipientDeliveryCharge) {
          subOrder.deliveryFee = subOrder.recipientDeliveryCharge;
          subOrder.recipientDeliveryCharge = 0;
        }
      });
    }

    const recipientItems = this.addedSubOrderItems.filter(
      item => item.deliveryCategory === DeliveryCategory.Recipient,
    );

    if (recipientItems.length === 0) {
      this.deliveryFeeTotal = 0;
      return;
    }

    const deliveryDetailsMap = new Map(this.addedSubOrderItems.map(e => [e.deliveryDetailId, e]));
    const groupedMap = new Map<string, any>();

    this.deliveryFeeTotal = 0;

    let isMasterRecipient = this.addedSubOrderItems[0]?.isMasterRecipient ?? false;

    if (isMasterRecipient) {
      this.calculateDeliveryChargeForSubOrders(this.customer?.hasDeliveryCharge, true);
    } else {
      recipientItems.forEach(recipientItem => {
        const deliveryDetail = deliveryDetailsMap.get(recipientItem.deliveryDetailId);
        if (!deliveryDetail) return;

        const key = `${recipientItem.recipientId}-${deliveryDetail.deliveryFrom}-${deliveryDetail.deliveryTo}`;

        if (!groupedMap.has(key)) {
          groupedMap.set(key, {
            recipientId: recipientItem.recipientId,
            deliveryFrom: deliveryDetail.deliveryTo,
            deliveryTo: deliveryDetail.deliveryFrom,
            deliveryFee: deliveryDetail.deliveryFee,
          });
        }

        const distinctGroups = Array.from(groupedMap.values());
        const total = this.customer?.hasDeliveryCharge
          ? distinctGroups.length * this.customer.deliveryCharge
          : distinctGroups.reduce((sum, group) => sum + group.deliveryFee, 0);

        this.deliveryFeeTotal = Number(this.toFixed(total));

        if (this.customer?.hasDeliveryCharge) {
          this.calculateDeliveryChargeForSubOrders(true, false);
        }
      });
    }
  }

  private calculateDeliveryChargeForSubOrders(
    hasCustomerDeliveryCharge: boolean,
    hasMasterRecipient: boolean,
  ) {
    this.addedSubOrderItems.map(subOrder => {
      if (
        hasCustomerDeliveryCharge &&
        (!subOrder.recipientDeliveryCharge || subOrder.recipientDeliveryCharge === 0)
      ) {
        subOrder.recipientDeliveryCharge = Number(this.toFixed(subOrder.deliveryFee));
      }
      let fee = hasCustomerDeliveryCharge
        ? this.customer.deliveryCharge / this.addedSubOrderItems.length
        : subOrder.deliveryFee;
      subOrder.deliveryFee = Number(this.toFixed(fee));
      if (hasMasterRecipient) this.deliveryFeeTotal += Number(this.toFixed(fee));
    });
  }

  populateOrderSummaryData(orderItem: OrderItem) {
    this.addedSubOrderItems = orderItem.subOrderItems;
    this.totalDiscount = orderItem.orderDiscount;
    this.savedDeliveryFeeTotal = orderItem.deliveryTotal;
    this.amountPayable = orderItem.orderTotal;
    this.amountPaid = orderItem.paidAmount.toString();
    this.tipAmount = orderItem.tipAmount;
    this.tipValueTypeId = orderItem.tipValueTypeId;
    this.orderId = orderItem.id;
    this.customerId = orderItem.customerId;
    this.orderType = orderItem.orderType;
    this.orderStatus = orderItem.orderStatus;
    this.reviewType = orderItem.reviewType;
    this.employeeId = orderItem.employeeId;
    this.taxAmount = orderItem.taxAmount;
    this.customerId = orderItem.customerId;
    this.orderEntryMode = 'edit';
    this.appliedDiscount = orderItem.appliedDiscount;
    this.parentOrderId = orderItem.parentOrderId;
    this.broadcastOrderSummary();
    this.sendReOrderPlacedNotification();
  }

  updateSelectedSubOrderIds(ids: string[]) {
    this.selectedSubOrderIds.next(ids);
  }
}
