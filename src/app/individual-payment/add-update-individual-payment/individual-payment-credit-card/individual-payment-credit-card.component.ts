import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CardPaymentResponseDto } from '@proxy/card';
import { PaymentMethod } from '@proxy/payment';
import { CreditCardPaymentDto } from 'src/app/shared/components/credit-card-payment/credit-card-payment-dto';
@Component({
  selector: 'app-individual-payment-credit-card',
  templateUrl: './individual-payment-credit-card.component.html',
  styleUrl: './individual-payment-credit-card.component.scss',
})
export class IndividualPaymentCreditCardComponent implements OnInit {
  protected readonly PaymentMethod = PaymentMethod;
  customerId: string;
  amountToCharge = 0;

  constructor(
    private dialogRef: MatDialogRef<IndividualPaymentCreditCardComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CreditCardPaymentDto,
  ) {}

  ngOnInit(): void {
    this.customerId = this.data.customerId;
    this.amountToCharge = this.data.amountToCharge ?? 0;
  }

  onAccept(response: CardPaymentResponseDto) {
    if (response?.isSuccess) this.dialogRef.close(response);
  }
}
