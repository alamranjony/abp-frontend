import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CardPaymentResponseDto } from '@proxy/card';
import { PaymentMethod } from '@proxy/payment';
import { CreditCardPaymentDto } from 'src/app/shared/components/credit-card-payment/credit-card-payment-dto';

@Component({
  selector: 'app-batch-card-payment-dialog',
  templateUrl: './batch-card-payment-dialog.component.html',
  styleUrls: ['./batch-card-payment-dialog.component.scss'],
})
export class BatchCardPaymentDialogComponent implements OnInit {
  protected readonly PaymentMethod = PaymentMethod;
  customerId: string;
  amountToCharge = 0;

  constructor(
    private dialogRef: MatDialogRef<BatchCardPaymentDialogComponent>,
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
