import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import {
  type CreateUpdateCustomerHouseAccountDto,
  CustomerDto,
  CustomerHouseAccountDto,
  CustomerHouseAccountService,
} from '@proxy/customers';
import { SharedDataService } from '../../shared-data.service';
import { ToasterService } from '@abp/ng.theme.shared';
import { ApplyPaymentDto, OrderService } from '@proxy/orders';
import { PaymentMethod } from '@proxy/payment';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-pos-house-account',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './pos-house-account.component.html',
  styleUrl: './pos-house-account.component.scss',
})
export class PosHouseAccountComponent implements OnInit {
  @Output() accept = new EventEmitter<number>();
  remainingAmount: number;
  customerHouseAccountDto: CustomerHouseAccountDto;
  customer: CustomerDto;
  orderId: string;

  constructor(
    private readonly customerHouseAccountService: CustomerHouseAccountService,
    private readonly sharedDataService: SharedDataService,
    private readonly toasterService: ToasterService,
    private readonly orderService: OrderService,
  ) {}

  ngOnInit(): void {
    this.customer = this.sharedDataService.getCustomer();
    if (this.customer?.id) {
      this.customerHouseAccountService
        .getCustomerHouseAccountByCustomerId(this.customer.id)
        .subscribe({
          next: response => {
            this.customerHouseAccountDto = response;
          },
          error: () => {
            this.toasterService.error('::Pos:CustomerHouseAccount:Error');
          },
        });
    }

    this.sharedDataService.orderSummary.subscribe(result => {
      this.remainingAmount = Number(result.amountDue || 0);
      this.orderId = result.orderId;
    });
  }

  get nextBalance(): number {
    const oldBalance = this.customerHouseAccountDto?.balance || 0;
    return oldBalance + (this.remainingAmount || 0);
  }

  onAccept(): void {
    if (!this.customerHouseAccountDto) {
      throw new Error('House account not found.');
    }

    if (this.customerHouseAccountDto.creditLimit < this.nextBalance) {
      this.toasterService.error('::Pos:CustomerHouseAccount:CreditLimitExceeded');
      return;
    }

    const applyPaymentDto: ApplyPaymentDto = {
      paymentMethod: PaymentMethod.HouseAccount,
      paidAmount: this.remainingAmount,
      orderId: this.orderId,
      customerId: this.customer.id,
      paymentMethodAdditionalFee: 0,
    };

    const houseAccountUpdatedDto: CreateUpdateCustomerHouseAccountDto = {
      ...this.customerHouseAccountDto,
      unBilledCharge:
        (this.customerHouseAccountDto.unBilledCharge || 0) + (this.remainingAmount || 0),
      balance: this.nextBalance,
    };

    this.orderService
      .applyPaymentToOrder(this.orderId, applyPaymentDto)
      .pipe(
        switchMap(() =>
          this.customerHouseAccountService.update(
            this.customerHouseAccountDto.id,
            houseAccountUpdatedDto,
          ),
        ),
      )
      .subscribe({
        next: () => {
          this.sharedDataService.calculatePaidAmount(this.remainingAmount);
          this.accept.emit(this.remainingAmount);
          this.sharedDataService.broadcastOrderSummary();
        },
        error: err => {
          if (err?.source === 'applyPayment') {
            this.toasterService.error('::Pos:CustomerHouseAccount:PaymentError');
          } else {
            this.toasterService.error('::Pos:CustomerHouseAccount:UpdateError');
          }
        },
      });
  }
}
