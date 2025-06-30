import { PaymentTransactionCodeDto } from '@proxy/payment-transaction-codes';

export interface TransactionTypeCodeItem extends PaymentTransactionCodeDto {
  paymentTransactionCodeCategoryDisplayName: string;
}
