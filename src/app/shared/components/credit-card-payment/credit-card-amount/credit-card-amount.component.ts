import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CorporateSettingService } from '@proxy/corporate-settings';
import { Subject, takeUntil } from 'rxjs';
import { SharedDataService } from 'src/app/pos/shared-data.service';

@Component({
  selector: 'app-credit-card-amount',
  templateUrl: './credit-card-amount.component.html',
  styleUrl: './credit-card-amount.component.scss',
})
export class CreditCardAmountComponent implements OnInit, OnDestroy {
  @Input() amountToCharge: number = 0;
  @Output() amountChanged = new EventEmitter<{
    amountToCharge: number;
    creditCardTotalFee: number;
  }>();

  creditCardFee: number = 0;
  enabledCreditCardFeeOnPosOrder: boolean = false;
  creditCardTotalFee: number = 0;
  amountToChargeTotalDisplay: number = 0;

  destroy$: Subject<void> = new Subject();

  constructor(
    private sharedDataService: SharedDataService,
    private corporateSettingService: CorporateSettingService,
  ) {}

  ngOnInit(): void {
    this.corporateSettingService
      .getCorporateSetting()
      .pipe(takeUntil(this.destroy$))
      .subscribe(corporateSetting => {
        this.creditCardFee = corporateSetting.creditCardFee;
        this.enabledCreditCardFeeOnPosOrder = corporateSetting.enabledCreditCardFeeOnPosOrder;
        this.calculateTotalDisplay();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  calculateTotalDisplay(): void {
    this.creditCardTotalFee = (this.amountToCharge * this.creditCardFee) / 100;
    this.amountToChargeTotalDisplay = Number(
      this.sharedDataService.toFixed(this.amountToCharge + this.creditCardTotalFee),
    );

    this.amountChanged.emit({
      amountToCharge: this.amountToCharge,
      creditCardTotalFee: this.creditCardTotalFee,
    });
  }

  onAmountChange(): void {
    this.calculateTotalDisplay();
  }
}
