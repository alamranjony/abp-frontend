import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
} from '@angular/core';
import { CREDIT_CARD_TAB, SAVED_CARD_TAB } from '../../constants';
import { Subject, takeUntil } from 'rxjs';
import { CreditCardSettingService } from '@proxy/credit-card-settings';
import { ToasterService } from '@abp/ng.theme.shared';
import { LocalizationService } from '@abp/ng.core';
import { OrderService } from '@proxy/orders';
import { SharedDataService } from 'src/app/pos/shared-data.service';
import { CardPaymentRequestDto, CardPaymentResponseDto, CardService } from '@proxy/card';
declare let Heartland: any;

@Component({
  selector: 'app-credit-card-payment',
  templateUrl: './credit-card-payment.component.html',
  styleUrl: './credit-card-payment.component.scss',
})
export class CreditCardPaymentComponent implements OnInit, OnDestroy {
  @Input() customerId: string;
  @Input() amountToCharge: number = 0;
  @Output() acceptEvent = new EventEmitter<CardPaymentResponseDto>();
  amountToChargeIncCreditCardFee: number = 0;
  isSubmitting = false;
  savedCards: any[] = [];
  selectedCardToken: string | null = null;
  activeTab: string = CREDIT_CARD_TAB;
  creditCardFee = 0;

  destroy$: Subject<void> = new Subject();
  private hps: any;
  private publicKey: string;

  constructor(
    private readonly renderer: Renderer2,
    private readonly creditCardSettingService: CreditCardSettingService,
    private readonly toaster: ToasterService,
    private localizationService: LocalizationService,
    private readonly orderAppService: OrderService,
    private readonly sharedDataService: SharedDataService,
    private readonly cardService: CardService,
  ) {}

  ngOnInit(): void {
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

  processCreditCardPayment(token: string): void {
    const amountToCharge = this.amountToCharge;

    const input: CardPaymentRequestDto = {
      customerId: this.customerId,
      cardToken: token,
      amount: amountToCharge,
      paymentMethodAdditionalFee: this.creditCardFee,
    };

    this.cardService
      .processCreditCardPayment(input)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.isSubmitting = false;
          if (response?.isSuccess) {
            this.toaster.success('::Pos:Payment:CreditCard:Success');
            this.acceptEvent.emit(response);
          } else {
            this.toaster.error('::Pos:Payment:CreditCard:Error');
          }
        },
        error: error => {
          this.toaster.error('::Pos:Payment:CreditCard:Error', error?.message);
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

    const input: CardPaymentRequestDto = {
      customerId: this.customerId,
      savedToken: this.selectedCardToken,
      amount: this.amountToCharge,
      paymentMethodAdditionalFee: 0,
    };

    this.cardService
      .processSavedCardPayment(input)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.isSubmitting = false;
          if (response?.isSuccess) {
            this.toaster.success('::Pos:Payment:CreditCard:Success');
            this.acceptEvent.emit(response);
          } else {
            this.toaster.error('::Pos:Payment:CreditCard:Error');
          }
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

  private loadSavedCards() {
    if (!this.customerId) return;

    this.orderAppService
      .getCustomerRecentCreditCards(this.customerId)
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

  private isValidAmount(): boolean {
    return (
      this.amountToChargeIncCreditCardFee &&
      this.amountToChargeIncCreditCardFee > 0 &&
      !isNaN(this.amountToChargeIncCreditCardFee)
    );
  }
}
