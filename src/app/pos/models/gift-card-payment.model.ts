import { GiftCardDto } from '@proxy/gift-cards';

export interface GiftCardPayment {
  giftCardTotalAmount: number;
  giftCardPaymentDtos: GiftCardDto[];
}
