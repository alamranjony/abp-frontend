import { Component, Input } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { CustomerHouseAccountDto } from '@proxy/customers';

@Component({
  selector: 'app-customer-payable-details',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './customer-payable-details.component.html',
  styleUrl: './customer-payable-details.component.scss',
})
export class CustomerPayableDetailsComponent {
  @Input() customerHouseAccount: CustomerHouseAccountDto;
  get balanceDetails() {
    return [
      {
        label: '::Customer:CustomerHouseAccount:CurrentAmount',
        value: this.customerHouseAccount?.currentAmount ?? 0,
      },
      {
        label: '::Customer:CustomerHouseAccount:Balance30Days',
        value: this.customerHouseAccount?.balance30Days ?? 0,
      },
      {
        label: '::Customer:CustomerHouseAccount:Balance60Days',
        value: this.customerHouseAccount?.balance60Days ?? 0,
      },
      {
        label: '::Customer:CustomerHouseAccount:Balance90Days',
        value: this.customerHouseAccount?.balance90Days ?? 0,
      },
      {
        label: '::Customer:CustomerHouseAccount:Balance120Days',
        value: this.customerHouseAccount?.balance120Days ?? 0,
      },
      {
        label: '::Customer:CustomerHouseAccount:BalanceOver120Days',
        value: this.customerHouseAccount?.balanceOver120Days ?? 0,
      },
      {
        label: '::Customer:CustomerHouseAccount:UnAppliedAmount',
        value: this.customerHouseAccount?.unAppliedAmount,
      },
      {
        label: '::Customer:CustomerHouseAccount:TotalFinancialCharge',
        value: this.customerHouseAccount?.totalChargeAmount,
      },
    ];
  }
}
