import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { GiftCardDto, GiftCardService } from '@proxy/gift-cards';
import { SharedModule } from 'src/app/shared/shared.module';

@Component({
  selector: 'app-pos-gift-card-check-balance',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './pos-gift-card-check-balance.component.html',
  styleUrl: './pos-gift-card-check-balance.component.scss',
})
export class PosGiftCardCheckBalanceComponent {
  noGiftCardFound: boolean = false;
  giftCardNumber: string;
  giftCard: GiftCardDto;
  giftCardRequired: boolean = false;

  constructor(
    private readonly giftCardService: GiftCardService,
    private dialogRef: MatDialogRef<PosGiftCardCheckBalanceComponent>,
  ) {}

  onClose = (): void => this.dialogRef.close();

  submitGiftCard() {
    this.giftCard = null;
    this.noGiftCardFound = false;
    this.giftCardRequired = !this.giftCardNumber.trim();

    if (this.giftCardRequired) return;

    this.giftCardService.getByCardNumber(this.giftCardNumber).subscribe(card => {
      if (card) this.giftCard = card;
      else this.noGiftCardFound = true;
    });
  }
}
