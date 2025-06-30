import { DiscountDto } from "@proxy/discounts";

export interface DiscountItem extends DiscountDto {
  discountTypeName: string;
  discountStatusName: string;
  discountApplicationTypeName: string;
}
