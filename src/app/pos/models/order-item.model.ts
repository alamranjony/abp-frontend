import {
  OrderDeliveryStatus,
  OrderStatus,
  OrderType,
  PaymentStatus,
  ReviewStatus,
  ReviewType,
} from '@proxy/orders';
import { SubOrderItem } from './sub-order-Item.model';
import { DiscountDto } from '@proxy/discounts';

export interface OrderItem {
  id?: string;
  orderNumber: number;
  orderTotal: number;
  deliveryTotal: number;
  orderDiscount: number;
  discountCodeId?: string;
  isPartialPaymentAllowed: boolean;
  tipAmount: number;
  paidAmount: number;
  taxAmount: number;
  customerId?: string;
  recipientId?: string;
  orderType: OrderType;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryStatus: OrderDeliveryStatus;
  reviewType: ReviewType;
  reviewStatus: ReviewStatus;
  shopId?: string;
  isActive: boolean;
  cancelSaleReasonValueId?: string;
  subOrderItems: SubOrderItem[];
  isGiftCardOrder: boolean;
  employeeId: string;
  appliedDiscount?: DiscountDto;
  parentOrderId?: string;
  tipValueTypeId?: string;
}
