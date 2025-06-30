import { Component, EventEmitter, Output } from '@angular/core';
import { GiftCardService, GiftCardDto, GiftCardType } from '@proxy/gift-cards';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { SharedDataService } from '../../shared-data.service';
import { OrderSummary } from '../../models/order-summary.model';
import { GiftCardPayment } from '../../models/gift-card-payment.model';
import { DEBOUNCE_TIME, PROMOTIONAL_GIFTCARD_GRACE_DAYS } from 'src/app/shared/constants';
import { LocalizationService } from '@abp/ng.core';

@Component({
  selector: 'app-pos-gift-card-payment',
  templateUrl: './pos-gift-card-payment.component.html',
  styleUrl: './pos-gift-card-payment.component.scss',
})
export class PosGiftCardPaymentComponent {
  @Output() accept = new EventEmitter<{ enteredAmount: number; cardNumber?: string }>();

  private giftCardNumberChanged: Subject<number> = new Subject<number>();
  giftCardNumber = '';
  giftCard: GiftCardDto;
  noGiftCardFound = false;
  orderSummary: OrderSummary;
  amountPayable = 0;
  giftCardTotal = 0;
  currentCartAmount = 0;
  isExpired = false;
  isValidAmount = true;
  giftCardUserInput = 0;
  validAmountErrorMessage = '';
  sameGiftCardSelected = false;
  existingGiftCards: GiftCardDto[];
  giftCardPayment: GiftCardPayment;
  orderId: string;
  gracePeriodExpirationDate: string;
  giftCardTypes = GiftCardType;

  constructor(
    private readonly giftCardService: GiftCardService,
    private readonly sharedDataService: SharedDataService,
    private readonly localizationService: LocalizationService,
  ) {}

  ngOnInit(): void {
    this.giftCardNumberChanged.pipe(debounceTime(DEBOUNCE_TIME)).subscribe(value => {
      this.onGiftCardNumberChange(value);
    });

    this.sharedDataService.giftCardPayment$.subscribe((giftCard: GiftCardPayment) => {
      if (!giftCard) return;
      this.giftCardPayment = giftCard;
    });

    this.sharedDataService.cartTotalAmount$.subscribe((cartTotal: number) => {
      if (this.giftCardPayment.giftCardTotalAmount > 0) this.currentCartAmount = cartTotal;
    });

    this.sharedDataService.orderSummary.subscribe((x: OrderSummary) => {
      if (!x) return;
      this.orderSummary = x;
      this.orderId = x.orderId;
      this.currentCartAmount = Number(this.orderSummary.amountDue);
    });
  }

  onInputChange(value: number) {
    this.isValidAmount = true;
    this.giftCardNumberChanged.next(value);
  }

  onGiftCardNumberChange(value: number) {
    if (!value) return;

    this.sameGiftCardSelected = false;
    const today = new Date().setHours(0, 0, 0, 0);
    this.gracePeriodExpirationDate = null;

    this.giftCardService.getByCardNumber(value.toString()).subscribe(card => {
      if (card) {
        this.existingGiftCards = this.giftCardPayment?.giftCardPaymentDtos || [];
        let matchedGiftCards = this.existingGiftCards.find(existCard => existCard.id === card.id);
        if (matchedGiftCards) {
          this.sameGiftCardSelected = true;
          this.noGiftCardFound = false;
          return;
        }
      }

      this.giftCard = card;
      this.noGiftCardFound = !card;

      if (this.noGiftCardFound) this.isExpired = false;

      if (this.giftCard) {
        const expireDate = this.giftCard.expirationDate
          ? new Date(this.giftCard.expirationDate).setHours(0, 0, 0, 0)
          : null;

        if (this.giftCard.giftCardType === GiftCardType.Promotional) {
          const promoGiftCardExpireDate = expireDate
            ? new Date(expireDate).setDate(
                new Date(expireDate).getDate() + PROMOTIONAL_GIFTCARD_GRACE_DAYS,
              )
            : null;

          this.gracePeriodExpirationDate = promoGiftCardExpireDate
            ? new Date(promoGiftCardExpireDate).toISOString()
            : null;
          this.isExpired = promoGiftCardExpireDate < today;
        } else {
          this.isExpired = expireDate && expireDate < today;
        }
      }
    });
  }

  acceptGiftCard() {
    this.giftCardTotal = this.giftCardPayment.giftCardTotalAmount;

    this.isValidAmount =
      this.giftCardUserInput <= this.currentCartAmount &&
      this.giftCardUserInput <= this.giftCard.balance &&
      this.giftCardUserInput > 0;
    if (this.isValidAmount) {
      this.giftCardTotal = this.roundToPlace(this.giftCardTotal + this.giftCardUserInput);
      this.giftCard.startingAmount = this.giftCard.balance;
      this.giftCard.amountCharged = this.giftCardUserInput;
      this.giftCard.balance = this.roundToPlace(this.giftCard.balance - this.giftCardUserInput);
      this.currentCartAmount = this.roundToPlace(this.currentCartAmount - this.giftCardUserInput);

      const existingGiftCards = this.giftCardPayment?.giftCardPaymentDtos || [];
      existingGiftCards.push(this.giftCard);
      this.giftCardPayment.giftCardPaymentDtos = existingGiftCards;

      this.giftCardService
        .updateGiftCardBalanceFromPos(this.orderId, this.giftCard)
        .subscribe(x => {
          this.sharedDataService.calculatePaidAmount(this.giftCardTotal);
          this.sharedDataService.broadcastOrderSummary();
          this.accept.emit({
            enteredAmount: this.giftCardUserInput,
            cardNumber: this.giftCard.cardNumber,
          });
        });
    } else {
      if (this.giftCardUserInput > this.currentCartAmount)
        this.validAmountErrorMessage = this.localizationService.instant(
          '::Pos:GiftCardGreaterAmount',
        );
      else if (this.giftCardUserInput > this.giftCard.balance)
        this.validAmountErrorMessage = this.localizationService.instant(
          '::Pos:GiftCardInsufficientAmount',
        );
      else
        this.validAmountErrorMessage = this.localizationService.instant(
          '::Pos:GiftCardInvalidAmount',
        );
    }
  }

  roundToPlace: (value: number, decimalPlaces?: number) => number = (value, decimalPlaces = 2) =>
    Number(value.toFixed(decimalPlaces));
}
