import { Component, Inject } from '@angular/core';
import { GiftCardDto } from '@proxy/gift-cards';
import { SharedDataService } from '../../shared-data.service';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-pos-gift-card-payment-details',
  templateUrl: './pos-gift-card-payment-details.component.html',
  styleUrl: './pos-gift-card-payment-details.component.scss',
})
export class PosGiftCardPaymentDetailsComponent {
  existingGiftCards: GiftCardDto[] = [];
  cardNumber: string;

  constructor(
    private readonly sharedDataService: SharedDataService,
    @Inject(MAT_DIALOG_DATA) public data: { cardNumber: string },
  ) {
    this.cardNumber = data.cardNumber;
  }

  ngOnInit(): void {
    this.sharedDataService.giftCardPayment$.subscribe(giftCard => {
      if (!giftCard) return;
      this.existingGiftCards = giftCard.giftCardPaymentDtos?.length
        ? giftCard.giftCardPaymentDtos.filter(giftCard => giftCard.cardNumber === this.cardNumber)
        : [];
    });
  }
}
