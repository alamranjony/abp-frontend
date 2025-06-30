export interface FinancialTransactionBatchItem {
  transactionNumber: string;
  totalAmount: number;
  dueAmount: number;
  amount: number;
  appliedAmount: number;
  selected: boolean;
  isPreviouslyApplied: boolean;
}

export interface BatchAccountListItem {
  id?: string;
  customerNo?: string;
  customerName?: string;
  paymentType: string;
  transactionCode: string;
  checkNo?: string;
  cardNo?: string;
  paymentAmount: number;
  note?: string;
  batchDetailId?: string;
  transactionDate: Date;
}
