import { DiscountDto, DiscountType } from '@proxy/discounts';
import {
  DeliveryCategory,
  DeliveryTimeType,
  DesignStatus,
  PriceType,
  SubOrderDeliveryStatus,
} from '@proxy/orders';
import { OccasionCode, RecipientDto, RecipientPersonalizationDto } from '@proxy/recipients';
import { ProductItem } from 'src/app/products/product.model';

export interface SubOrderItem {
  id?: string;
  orderId: string;
  productId: string;
  qty: number;
  unitPrice: number;
  subTotal: number;
  discountId?: string;
  discountAmount: number;
  itemSpecificDiscount: number;
  selected: boolean;
  productItem: ProductItem;
  discountType?: DiscountType;
  discountCode?: string;
  filteredDiscounts: DiscountDto[];
  recipient: RecipientDto;
  recipientId?: string;
  specialInstruction?: string;
  isLock: boolean;
  deliveryFrom?: string;
  deliveryTo?: string;
  cardMsg?: string;
  slotId?: string;
  zoneId?: string;
  isTimeRequired: boolean;
  priceType: PriceType;
  isCheckout: boolean;
  deliveryFee: number;
  deliveryTimeType: DeliveryTimeType;
  relayFee: number;
  shopId?: string;
  pickupPersonName?: string;
  pickupTime?: string;
  occasionTypeValueId?: string;
  creditReasonValueId?: string;
  saleTypeId: number;
  cancelReasonValueId?: string;
  replaceReasonValueId?: string;
  isWillPickup: boolean;
  isCarryOut: boolean;
  wireOrderId?: string;
  retryNumber: number;
  cutoffFee: number;
  expressFee: number;
  wireoutFee: number;
  timeReqFee: number;
  sundryFee: number;
  weddingFee: number;
  isWireServiceOrder: boolean;
  deliveryCategory?: DeliveryCategory;
  deliveryStatus: SubOrderDeliveryStatus;
  personalizations: RecipientPersonalizationDto[];
  recipientName?: string;
  zoneSaleTax: number;
  orderDetails?: string;
  giftCardExpireDate?: string;
  deliveryDetailId?: string;
  occasionCode?: OccasionCode;
  salesTax: number;
  isMasterRecipient: boolean;
  recipientDeliveryCharge: number;
  storeId: string;
  designStatus: DesignStatus;
}
