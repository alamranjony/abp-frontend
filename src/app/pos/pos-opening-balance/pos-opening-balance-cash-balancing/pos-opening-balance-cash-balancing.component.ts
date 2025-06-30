import { Component, computed, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { CreateUpdateOpeningBalanceDto, OpeningBalanceService } from '@proxy/opening-balances';
import { SharedModule } from 'src/app/shared/shared.module';
import { SharedDataService } from '../../shared-data.service';
import { Confirmation, ConfirmationService, ToasterService } from '@abp/ng.theme.shared';
import { LocalizationService } from '@abp/ng.core';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-pos-opening-balance-cash-balancing',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './pos-opening-balance-cash-balancing.component.html',
  styleUrl: './pos-opening-balance-cash-balancing.component.scss',
})
export class PosOpeningBalanceCashBalancingComponent implements OnInit {
  formGroup: FormGroup;
  destroy$: Subject<void> = new Subject();

  hundreds = signal(0);
  fifties = signal(0);
  twenties = signal(0);
  tens = signal(0);
  fives = signal(0);
  twos = signal(0);
  ones = signal(0);
  twentyFiveCents = signal(0);
  tenCents = signal(0);
  fiveCents = signal(0);
  oneCents = signal(0);
  other = signal(0);
  zOutTotalCash = signal(0);
  zOutTotalChecks = signal(0);
  zOutTotalCard = signal(0);
  zOutTotalGiftCard = signal(0);
  zOutTotalHouseAccount = signal(0);
  cashAmount: number = 0;
  checkAmount: number = 0;
  cardAmount: number = 0;
  giftCardAmount: number = 0;
  houseAccountAmount: number = 0;
  openingBalance: number = 0;
  openingBalanceDto: CreateUpdateOpeningBalanceDto = {
    balance: 0,
  };

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<PosOpeningBalanceCashBalancingComponent>,
    private openingBalanceService: OpeningBalanceService,
    private sharedDataService: SharedDataService,
    private confirmationService: ConfirmationService,
    private localizationService: LocalizationService,
    private toasterService: ToasterService,
  ) {}

  ngOnInit(): void {
    this.formInitializationAndChanges();
    this.getOpeningBalancePaidAmount();
  }

  formInitializationAndChanges = () => {
    this.formGroup = this.fb.group({
      hundreds: [0],
      fifties: [0],
      twenties: [0],
      tens: [0],
      fives: [0],
      twos: [0],
      ones: [0],
      twentyFiveCents: [0],
      tenCents: [0],
      fiveCents: [0],
      oneCents: [0],
      other: [0],
      zOutTotalCash: [{ value: 0, disabled: true }],
      zOutTotalChecks: [0],
      zOutTotalCard: [0],
      zOutTotalHouseAccount: [0],
      zOutTotalGiftCard: [0],
      zOutTotalDrawerCount: [{ value: 0, disabled: true }],
      difference: [{ value: 0, disabled: true }],
      note: [''],
    });

    this.formGroup.get('hundreds')?.valueChanges.subscribe(value => this.hundreds.set(value || 0));
    this.formGroup.get('fifties')?.valueChanges.subscribe(value => this.fifties.set(value || 0));
    this.formGroup.get('twenties')?.valueChanges.subscribe(value => this.twenties.set(value || 0));
    this.formGroup.get('tens')?.valueChanges.subscribe(value => this.tens.set(value || 0));
    this.formGroup.get('fives')?.valueChanges.subscribe(value => this.fives.set(value || 0));
    this.formGroup.get('twos')?.valueChanges.subscribe(value => this.twos.set(value || 0));
    this.formGroup.get('ones')?.valueChanges.subscribe(value => this.ones.set(value || 0));
    this.formGroup
      .get('twentyFiveCents')
      ?.valueChanges.subscribe(value => this.twentyFiveCents.set(value || 0));
    this.formGroup.get('tenCents')?.valueChanges.subscribe(value => this.tenCents.set(value || 0));
    this.formGroup
      .get('fiveCents')
      ?.valueChanges.subscribe(value => this.fiveCents.set(value || 0));
    this.formGroup.get('oneCents')?.valueChanges.subscribe(value => this.oneCents.set(value || 0));
    this.formGroup.get('other')?.valueChanges.subscribe(value => this.other.set(value || 0));
    this.formGroup
      .get('zOutTotalCash')
      ?.valueChanges.subscribe(value => this.zOutTotalCash.set(value || 0));
    this.formGroup
      .get('zOutTotalChecks')
      ?.valueChanges.subscribe(value => this.zOutTotalChecks.set(value || 0));
    this.formGroup
      .get('zOutTotalCard')
      ?.valueChanges.subscribe(value => this.zOutTotalCard.set(value || 0));
    this.formGroup
      .get('zOutTotalGiftCard')
      ?.valueChanges.subscribe(value => this.zOutTotalGiftCard.set(value || 0));
    this.formGroup
      .get('zOutTotalHouseAccount')
      ?.valueChanges.subscribe(value => this.zOutTotalHouseAccount.set(value || 0));
  };

  getOpeningBalancePaidAmount = () => {
    this.openingBalanceService
      .getOpeningBalancePaidAmounts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: paidAmount => {
          this.openingBalance = paidAmount.openingBalance;
          this.cashAmount = paidAmount.totalCashAmount;
          this.checkAmount = paidAmount.totalCheckAmount;
          this.cardAmount = paidAmount.totalCardAmount;
          this.giftCardAmount = paidAmount.totalGiftCardAmount;
          this.houseAccountAmount = paidAmount.totalHouseAccountAmount;
        },
        error: () => {
          this.onClose();
        },
      });
  };

  preventDecimal(event: KeyboardEvent): void {
    if (event.key === '.' || event.key === ',') {
      event.preventDefault();
    }
  }

  totalCashBalance = computed(() =>
    Number(
      this.sharedDataService.toFixed(
        this.hundreds() * 100 +
          this.fifties() * 50 +
          this.twenties() * 20 +
          this.tens() * 10 +
          this.fives() * 5 +
          this.twos() * 2 +
          this.ones() * 1 +
          this.twentyFiveCents() * 0.25 +
          this.tenCents() * 0.1 +
          this.fiveCents() * 0.05 +
          this.oneCents() * 0.01 +
          this.other(),
      ),
    ),
  );

  totalDrawerAmount = (): number => {
    const totalAmount =
      this.cashAmount +
      this.cardAmount +
      this.checkAmount +
      this.giftCardAmount +
      this.houseAccountAmount;

    return Number(this.sharedDataService.toFixed(totalAmount));
  };

  totalZOutDrawerAmount = computed(() =>
    Number(
      this.sharedDataService.toFixed(
        this.totalCashBalance() +
          this.zOutTotalChecks() +
          this.zOutTotalCard() +
          this.zOutTotalGiftCard() +
          this.zOutTotalHouseAccount(),
      ),
    ),
  );

  calculateDecimalValues = (value1: number, value2: number): number => {
    return Number(this.sharedDataService.toFixed(value1 * value2));
  };

  calculateBalanceDifference = (value1: number, value2: number): number => {
    return Math.abs(Number(this.sharedDataService.toFixed(value1 - value2)));
  };

  onClose = (): void => this.dialogRef.close();

  proceedOnClosingBalance() {
    const balanceDifferenceResourceStr = this.localizationService.instant(
      '::Pos:OpeningBalance.CashDrawer.BalanceDifference',
    );
    const BalanceDifference = this.calculateBalanceDifference(
      this.totalDrawerAmount(),
      this.totalZOutDrawerAmount(),
    );

    this.confirmationService
      .warn(
        `${balanceDifferenceResourceStr} ${BalanceDifference}`,
        '::Pos:OpeningBalance.CashDrawer.Proceed',
      )
      .subscribe(status => {
        if (status != Confirmation.Status.confirm) return;
        this.closeOpeningBalance();
      });
  }

  closeOpeningBalance = () => {
    this.openingBalanceDto.note = this.formGroup.get('note').value;
    this.openingBalanceService
      .closeOpeningBalance(this.openingBalanceDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toasterService.success('::Pos:OpeningBalanceUpdate');
          this.dialogRef.close();
        },
        error: () => {
          this.toasterService.error('::Pos:OpeningBalanceError');
        },
      });
  };

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
