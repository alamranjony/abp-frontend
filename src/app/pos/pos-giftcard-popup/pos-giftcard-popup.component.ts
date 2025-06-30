import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  CreateUpdateGiftCardDto,
  GiftCardDto,
  GiftCardRenewDto,
  GiftCardService,
  GiftCardStatus,
  GiftCardType,
} from '@proxy/gift-cards';
import { MatChipInputEvent } from '@angular/material/chips';
import { ToasterService } from '@abp/ng.theme.shared';

@Component({
  selector: 'app-pos-giftcard-popup',
  templateUrl: './pos-giftcard-popup.component.html',
  styleUrls: ['./pos-giftcard-popup.component.scss'],
})
export class PosGiftcardPopupComponent implements OnInit {
  giftCardForm: FormGroup;
  isEditing = false;
  editedDetails: string;
  readonly defaultImageURL = '/assets/images/demo/gc.png';
  minDate = new Date();
  giftCard: GiftCardDto;
  description: string = '';
  descriptionHeight: string = 'auto';
  chips: number[] = [];
  newChip: string = '';
  chipsControl = this.fb.control([]);
  separatorKeysCodes: number[] = [13, 188];
  qty: number = 1;
  cardNumbersDescription: string = '';

  constructor(
    private fb: FormBuilder,
    private giftCardService: GiftCardService,
    public dialogRef: MatDialogRef<PosGiftcardPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toaster: ToasterService,
  ) {
    this.editedDetails = data.description;
  }

  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    this.giftCardForm = this.fb.group({
      cardValue: ['', Validators.required],
      giftCardExpiryDate: [new Date(), Validators.required],
      giftCardNumber: ['', Validators.required],
      qty: [1, Validators.min(1)],
      chips: this.chipsControl,
    });
  }

  handleImageError(event: any) {
    event.target.src = this.defaultImageURL;
  }

  toggleEdit(): void {
    this.isEditing = true;
  }

  saveDetails(): void {
    this.data.description = this.editedDetails;
    this.isEditing = false;
  }

  save() {
    if (!this.giftCardForm.value.giftCardNumber?.trim()) {
      this.giftCardForm.value.giftCardNumber = null;
      this.giftCardForm.get('giftCardNumber')?.setErrors({ required: true });
    }
    if (this.giftCardForm.invalid) {
      this.giftCardForm.markAllAsTouched();
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }

    this.qty = this.giftCardForm.value.qty;

    if (this.qty > 1) {
      this.cardNumbersDescription = this.giftCardForm.value.chips.join(', ');
      this.data.bulkQty = this.qty;
      this.data.giftCardExpireDate = this.giftCardForm.value.giftCardExpiryDate;
      this.data.description = this.cardNumbersDescription;
      this.data.unitCost = this.giftCardForm.value.cardValue;
      this.dialogRef.close(this.data);
    }

    if (this.qty == 1) {
      this.data.bulkQty = this.qty;
      this.data.giftCardExpireDate = this.giftCardForm.value.giftCardExpiryDate;
      this.data.description = this.giftCardForm.value.giftCardNumber;
      this.data.unitCost = this.giftCardForm.value.cardValue;
      this.dialogRef.close(this.data);
    }
  }

  generateNumbers(): void {
    const baseNumber = parseInt(this.giftCardForm.get('giftCardNumber')?.value, 10);
    const qty = this.giftCardForm.get('qty')?.value;
    if (!isNaN(baseNumber) && qty > 0) {
      this.giftCardService
        .generateValidGiftCardNumbersByBaseNumberAndQuantity(baseNumber, qty)
        .subscribe(validNumbers => {
          this.chipsControl.setValue(validNumbers);
        });
    } else {
      this.chipsControl.setValue([]);
    }
    this.cardNumbersDescription = this.giftCardForm.value.chips.join(', ');
  }

  addChip(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value) {
      const chipValue = parseInt(value, 10);
      const chips = this.chipsControl.value;

      if (!isNaN(chipValue) && !chips.includes(chipValue)) {
        this.chipsControl.setValue([...chips, chipValue]);
      }
    }

    event.chipInput!.clear();
    this.updateQty();
  }

  removeChip(chip: number): void {
    const chips = this.chipsControl.value;
    const updatedChips = chips.filter((c: number) => c !== chip);

    this.chipsControl.setValue(updatedChips);
    this.updateQty();
  }

  updateQty(): void {
    const chipsCount = this.chipsControl.value.length;
    this.giftCardForm.get('qty')?.setValue(chipsCount);
  }

  renewGiftCard() {
    let expiryDateInUtc = this.getUtcStringOfMidnight(
      this.giftCardForm.value?.giftCardExpiryDate as Date,
    );

    let dto: GiftCardRenewDto = {
      renewalAmount: this.giftCardForm.value?.cardValue,
      extendedTillDate: expiryDateInUtc,
      giftCardId: this.giftCard.id,
    };
    this.giftCardService.renew(dto).subscribe(x => {
      this.data = { ...x, unitCost: this.giftCardForm.value?.cardValue };
      this.dialogRef.close(this.data);
    });
  }

  createGiftCard() {
    let expiryDateInUtc = this.getUtcStringOfMidnight(
      this.giftCardForm.value?.giftCardExpiryDate as Date,
    );
    let dto: CreateUpdateGiftCardDto = {
      cardNumber: this.giftCardForm.value?.giftCardNumber,
      giftCardType: GiftCardType.Normal,
      balance: this.giftCardForm.value?.cardValue,
      expirationDate: expiryDateInUtc,
      giftCardStatus: GiftCardStatus.Active,
    };
    this.giftCardService.create(dto).subscribe(x => {
      this.data = {
        ...x,
        unitCost: this.giftCardForm.value?.cardValue,
        bulkQty: this.qty,
        description: this.cardNumbersDescription,
      };
      this.dialogRef.close(this.data);
    });
  }

  getUtcStringOfMidnight(date: Date): string {
    if (!date) return new Date().toUTCString();
    let expiryDateInSeconds = date.setHours(23, 59, 59, 0);
    return new Date(expiryDateInSeconds).toUTCString();
  }
}
