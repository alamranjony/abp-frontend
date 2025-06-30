import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CorporateSettingService } from '@proxy/corporate-settings';
import { Subject, takeUntil } from 'rxjs';
import { SharedDataService } from 'src/app/pos/shared-data.service';

@Component({
  selector: 'app-card-amount',
  templateUrl: './card-amount.component.html',
})
export class CardAmountComponent implements OnInit, OnChanges, OnDestroy {
  amountToCharge: number = 0;
  @Input() creditCardFee: number = 0;
  @Input() enabledCreditCardFeeOnPosOrder: boolean = false;
  @Output() amountChanged = new EventEmitter<{
    amountToCharge: number;
    creditCardTotalFee: number;
  }>();
  destroy$: Subject<void> = new Subject();

  creditCardTotalFee: number = 0;
  amountToChargeTotalDisplay: number = 0;

  constructor(
    private sharedDataService: SharedDataService,
    private corporateSettingService: CorporateSettingService,
  ) {}

  ngOnInit(): void {
    this.sharedDataService.orderSummary.pipe(takeUntil(this.destroy$)).subscribe(x => {
      this.amountToCharge = Number(x.amountDue);
    });

    this.corporateSettingService.getCorporateSetting().pipe(takeUntil(this.destroy$)).subscribe(corporateSetting => {
      this.creditCardFee = corporateSetting.creditCardFee;
      this.enabledCreditCardFeeOnPosOrder = corporateSetting.enabledCreditCardFeeOnPosOrder;
      this.calculateTotalDisplay();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.creditCardFee) {
      this.calculateTotalDisplay();
    }
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

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
