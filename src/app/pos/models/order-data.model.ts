import { SubOrderItem } from './sub-order-Item.model';

export interface OrderRawData {
  subOrderItems: SubOrderItem[];
  deliveryFeeTotal:number;
}