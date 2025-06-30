export interface PosPayment {
  paymentMethodId: number;
  paymentMethodName: string;
  amount: number;
  extraProperties?: object;
}
