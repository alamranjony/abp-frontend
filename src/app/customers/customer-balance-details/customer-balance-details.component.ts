import { Component, OnInit } from '@angular/core';
import { ListService } from '@abp/ng.core';
import { ActivatedRoute } from '@angular/router';
import { CustomerHouseAccountDto, CustomerHouseAccountService } from '@proxy/customers';

@Component({
  selector: 'app-customer-balance-details',
  templateUrl: './customer-balance-details.component.html',
  styleUrl: './customer-balance-details.component.scss',
  providers: [ListService],
})
export class CustomerBalanceDetailsComponent implements OnInit {
  private customerId: string;
  customerHouseAccount: CustomerHouseAccountDto;
  get balanceDetails() {
    return [
      {
        label: '::Customer:CustomerHouseAccount:PreviousMonthAmount',
        value: this.customerHouseAccount?.previousMonthBilledAmount ?? 0,
      },
      {
        label: '::Customer:CustomerHouseAccount:UnBilledCharge',
        value: this.customerHouseAccount?.unBilledCharge ?? 0,
      },
      {
        label: '::Customer:CustomerHouseAccount:BilledCharge',
        value: this.customerHouseAccount?.billedCharge ?? 0,
      },
      {
        label: '::Customer:CustomerHouseAccount:Credit',
        value: this.customerHouseAccount?.remainingCreditAmount ?? 0,
      },
      {
        label: '::Customer:CustomerHouseAccount:Payment',
        value: this.customerHouseAccount?.payment ?? 0,
      },
      {
        label: '::Customer:CustomerHouseAccount:Balance',
        value: this.customerHouseAccount?.balance ?? 0,
      },
    ];
  }

  constructor(
    public readonly list: ListService,
    private readonly route: ActivatedRoute,
    private readonly customerHouseAccountService: CustomerHouseAccountService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.customerId = params.get('id');
      if (this.customerId) {
        this.loadCustomerHouseAccountDetails();
      }
    });
  }

  private loadCustomerHouseAccountDetails() {
    this.customerHouseAccountService
      .getCustomerHouseAccountByCustomerId(this.customerId)
      .subscribe(response => {
        this.customerHouseAccount = response;
      });
  }
}
