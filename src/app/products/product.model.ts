import { ProductDto } from '@proxy/products';

export interface ProductItem extends ProductDto {
  added: boolean;
  selected: boolean;
  imageSrc: string;
  isProductType?: boolean;
  bulkQty?: number;
  giftCardExpireDate?: string;
}
