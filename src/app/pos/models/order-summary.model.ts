import { CustomerDto } from '@proxy/customers';
import { DiscountApplicationType } from '@proxy/discounts';
import { SubOrderItem } from './sub-order-Item.model';
import { RecipientDto } from '@proxy/recipients';
import { OrderStatus, OrderType, ReviewType } from '@proxy/orders';

export interface OrderSummary {
  totalSubOrdersCount: number;
  subTotal: number;
  total: number;
  totalAmount: number;
  deliveryFeeTotal: number;
  savedDeliveryFeeTotal: number;
  isDeliveryFeeTotalReduced?: boolean;
  totalDiscountOnItems: number;
  totalDiscountOnOrder: number;
  totalDiscountOnDeliveryFee: number;
  appliedDiscountCodeId: string;
  customerId?: string;
  customer?: CustomerDto;
  totalDiscount: number;
  totalOrderItems: number;
  discountApplicationType?: DiscountApplicationType;
  amountPayable: number;
  tipAmount: number;
  tipValueTypeId?: string;
  subOrderItems: SubOrderItem[];
  masterRecipient: RecipientDto;
  taxAmount: number;
  orderId: string;
  amountDue: string;
  changeDue: string;
  amountPaid: string;
  isTotalAmountPaid: boolean;
  orderType: OrderType;
  orderStatus: OrderStatus;
  reviewType: ReviewType;
  employeeId?: string;
  orderEntryMode?: string;
  parentOrderId?: string;
  tipType?: string;
}
