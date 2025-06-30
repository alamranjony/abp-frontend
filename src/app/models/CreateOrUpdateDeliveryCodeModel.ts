import { CreateOrUpdateDeliveryCodeDto } from '@proxy/deliveries';

export default interface CreateOrUpdateDeliveryCodeModel extends CreateOrUpdateDeliveryCodeDto {
  isEditMode: boolean;
}
