import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { OrderSummary } from '../../models/order-summary.model';
import { SharedDataService } from '../../shared-data.service';
import { ToasterService } from '@abp/ng.theme.shared';
import { PaymentMethod } from '@proxy/payment';
import { ApplyPaymentDto, OrderService } from '@proxy/orders';

@Component({
  selector: 'app-pos-cash',
  templateUrl: './pos-cash.component.html',
  styleUrl: './pos-cash.component.scss',
})
export class PosCashComponent implements OnInit {
  initialAmountDue: number;
  cashPaid: number = 0;
  changeDue: number;
  orderSummary: OrderSummary;
  orderId: string;
  customerId: string;
  remainingAmount: number;
  @Output() accept = new EventEmitter<any>();

  get acceptedCashAmount(): number {
    return Math.min(this.initialAmountDue, this.cashPaid);
  }

  constructor(
    private readonly sharedDataService: SharedDataService,
    private readonly toasterService: ToasterService,
    private readonly orderService: OrderService,
  ) {}

  ngOnInit(): void {
    this.sharedDataService.orderSummary.subscribe(orderSummary => {
      this.orderSummary = orderSummary;
      this.orderId = orderSummary.orderId;
      this.customerId = orderSummary.customer?.id;
      this.remainingAmount = Number(orderSummary.amountDue || 0);
      if (this.initialAmountDue === undefined || this.changeDue === undefined) {
        this.initialAmountDue = this.changeDue = this.remainingAmount;
      }
    });
  }

  onAccept() {
    const applyPaymentDto: ApplyPaymentDto = {
      paymentMethod: PaymentMethod.Cash,
      paidAmount: this.acceptedCashAmount,
      orderId: this.orderId,
      customerId: this.customerId,
      paymentMethodAdditionalFee: 0,
    };

    this.orderService.applyPaymentToOrder(this.orderId, applyPaymentDto).subscribe({
      next: () => {
        this.sharedDataService.calculatePaidAmount(this.cashPaid);
        this.sharedDataService.broadcastOrderSummary();
        this.accept.emit(this.acceptedCashAmount);
      },
      error: () => {
        this.toasterService.error('Cash payment failed');
      },
    });
  }

  calculateChange(): void {
    this.changeDue = Math.round((this.initialAmountDue - this.cashPaid) * 100) / 100;
  }
}
