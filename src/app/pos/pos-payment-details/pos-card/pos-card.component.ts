import { ToasterService } from '@abp/ng.theme.shared';
import { Component, EventEmitter, Output, OnInit, Renderer2, OnDestroy } from '@angular/core';
import { CreditCardSettingService } from '@proxy/credit-card-settings';
import { OrderService } from '@proxy/orders';
import { CREDIT_CARD_TAB, SAVED_CARD_TAB } from 'src/app/shared/constants';
import { SharedDataService } from '../../shared-data.service';
import { Subject, takeUntil } from 'rxjs';
import { LocalizationService } from '@abp/ng.core';

declare let Heartland: any;
@Component({
  selector: 'app-pos-card',
  templateUrl: './pos-card.component.html',
  styleUrls: ['./pos-card.component.scss'],
})
export class PosCardComponent implements OnInit, OnDestroy {
  @Output() accept = new EventEmitter<any>();
  private hps: any;
  private publicKey: string;
  amountToCharge: number = 0;
  amountToChargeIncCreditCardFee: number = 0;
  isSubmitting = false;
  savedCards: any[] = [];
  customer: any;
  selectedCardToken: string | null = null;
  activeTab: string = CREDIT_CARD_TAB;
  creditCardFee = 0;
  enabledCreditCardFeeOnPosOrder = false;
  orderId: string;

  destroy$: Subject<void> = new Subject();

  constructor(
    private readonly renderer: Renderer2,
    private readonly creditCardSettingService: CreditCardSettingService,
    private readonly orderAppService: OrderService,
    private readonly toaster: ToasterService,
    private readonly sharedDataService: SharedDataService,
    private localizationService: LocalizationService,
  ) {}

  ngOnInit(): void {
    this.sharedDataService.orderSummary.pipe(takeUntil(this.destroy$)).subscribe(result => {
      this.amountToCharge = Number(result.amountDue);
      this.orderId = result.orderId;
    });
    this.loadCustomer();
    this.loadSavedCards();

    this.creditCardSettingService
      .getCreditCardSetting()
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.publicKey = response.publicKey;
        this.initializeHeartland();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyHeartland();
  }

  private initializeHeartland() {
    this.hps = new Heartland.HPS({
      publicKey: this.publicKey,
      type: 'iframe',
      fields: {
        cardNumber: {
          target: 'iframesCardNumber',
          placeholder: '•••• •••• •••• ••••',
        },
        cardExpiration: {
          target: 'iframesCardExpiration',
          placeholder: 'MM / YYYY',
        },
        cardCvv: {
          target: 'iframesCardCvv',
          placeholder: 'CVV',
        },
        submit: {
          target: 'iframesSubmit',
        },
      },
      style: {
        input: {
          background: '#fff',
          border: '1px solid',
          borderColor: '#bbb3b9 #c7c1c6 #c7c1c6',
          boxSizing: 'border-box',
          fontFamily: 'serif',
          fontSize: '16px',
          lineHeight: '1',
          margin: '0 .5em 0 0',
          maxWidth: '100%',
          outline: '0',
          padding: '0.5278em',
          verticalAlign: 'baseline',
          height: '30px',
          width: '100%',
        },
        '#heartland-field': {
          padding: '6px 12px',
          fontSize: '14px',
          lineHeight: '1.42857143',
          color: '#555',
          backgroundColor: '#fff',
          border: '1px solid #ccc',
        },
      },
      onTokenSuccess: resp => {
        this.processCreditCardPayment(resp.token_value);
      },
      onTokenError: resp => {
        const errorText = this.localizationService.instant('::Pos:Payment:CreditCard:TokenError');
        this.toaster.error(errorText + ' ' + resp.error.message);
        this.isSubmitting = false;
      },
    });
  }

  private loadCustomer() {
    this.customer = this.sharedDataService.getCustomer();
  }

  private loadSavedCards() {
    if (!this.customer?.id) return;
    this.orderAppService
      .getCustomerRecentCreditCards(this.customer.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: cards => {
          this.savedCards = cards;
        },
        error: error => {
          this.toaster.error('::Pos:Payment:SavedCard:Error', error?.message);
        },
      });
  }

  private destroyHeartland() {
    if (this.hps) {
      const iframeIds = [
        'iframesCardNumber',
        'iframesCardExpiration',
        'iframesCardCvv',
        'iframesSubmit',
      ];

      iframeIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          this.renderer.setProperty(element, 'innerHTML', '');
        }
      });
      this.hps.dispose();
      this.hps = null;
    }
  }

  onTabSelectChange(tabChange: any) {
    const tabs = [CREDIT_CARD_TAB, SAVED_CARD_TAB];
    this.activeTab = tabs[tabChange?.index] || CREDIT_CARD_TAB;
    if (this.activeTab == CREDIT_CARD_TAB) {
      this.destroyHeartland();
      this.initializeHeartland();
      this.selectedCardToken = null;
    }
  }

  submitPaymentData() {
    if (!this.isValidAmount()) {
      this.toaster.error('::Pos:Payment:CreditCard:InvalidAmount');
      this.isSubmitting = false;
      return;
    }

    this.isSubmitting = true;

    switch (this.activeTab) {
      case CREDIT_CARD_TAB:
        this.hps.Messages.post(
          {
            accumulateData: true,
            action: 'tokenize',
            message: this.publicKey,
          },
          'cardNumber',
        );
        break;

      case SAVED_CARD_TAB:
        this.processPaymentWithSavedCard();
        break;

      default:
        this.isSubmitting = false;
        break;
    }
  }

  private isValidAmount(): boolean {
    return (
      this.amountToChargeIncCreditCardFee &&
      this.amountToChargeIncCreditCardFee > 0 &&
      !isNaN(this.amountToChargeIncCreditCardFee)
    );
  }

  processCreditCardPayment(token: string): void {
    const amountToCharge = this.amountToCharge;
    this.orderAppService
      .processCreditCardPayment(
        this.orderId,
        this.customer.id,
        token,
        amountToCharge,
        this.creditCardFee,
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toaster.success('::Pos:Payment:CreditCard:Success');
          this.isSubmitting = false;
          this.sharedDataService.calculatePaidAmount(amountToCharge);
          this.sharedDataService.broadcastOrderSummary();

          this.accept.emit(amountToCharge);
        },
        error: () => {
          this.toaster.error('::Pos:Payment:CreditCard:Error');
          this.isSubmitting = false;
        },
      });
  }

  processPaymentWithSavedCard() {
    if (!this.selectedCardToken) {
      this.toaster.error('::Pos:Payment:SavedCard:InvalidSelectedCard');
      this.isSubmitting = false;
      return;
    }
    this.orderAppService
      .processSavedCardPayment(this.customer.id, this.selectedCardToken, this.amountToCharge)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toaster.success('::Pos:Payment:CreditCard:Success');
          this.isSubmitting = false;
          this.accept.emit(this.amountToCharge);
        },
        error: error => {
          this.toaster.error('::Pos:Payment:CreditCard:Error', error?.message);
          this.isSubmitting = false;
        },
      });
  }

  onAmountChanged(chargedAmountData: { amountToCharge: number; creditCardTotalFee: number }): void {
    this.amountToCharge = Number(this.sharedDataService.toFixed(chargedAmountData.amountToCharge));
    this.creditCardFee = Number(
      this.sharedDataService.toFixed(chargedAmountData.creditCardTotalFee),
    );
    this.amountToChargeIncCreditCardFee = Number(
      this.sharedDataService.toFixed(this.amountToCharge + this.creditCardFee),
    );
  }
}
