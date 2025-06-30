import { Component, Inject, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { OrderSummary } from '../../models/order-summary.model';
import { MatDialogRef } from '@angular/material/dialog';
import { SharedDataService } from '../../shared-data.service';
@Component({
  selector: 'app-partial-payment-confirmation',
  templateUrl: './partial-payment-confirmation.component.html',
  styleUrls: ['./partial-payment-confirmation.component.scss'],
})
export class PartialPaymentConfirmationComponent implements OnInit {
  orderSummary$: Observable<OrderSummary>;

  constructor(
    private dialogRef: MatDialogRef<PartialPaymentConfirmationComponent>,
    private sharedDataService: SharedDataService,
  ) {}

  ngOnInit() {
    this.orderSummary$ = this.sharedDataService.orderSummary;
  }

  onConfirmation() {
    this.dialogRef.close({ isPartialPaymentConfirmed: true });
  }

  onCancel() {
    this.dialogRef.close({ isPartialPaymentConfirmed: false });
  }
}
