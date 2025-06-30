import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  giftCardStatusOptions,
  giftCardTypeOptions,
  GiftCardDto,
  GiftCardService,
} from '@proxy/gift-cards';
import { ValueDto } from '@proxy/values';
import { ToasterService } from '@abp/ng.theme.shared';
import { sortEnumValues } from 'src/app/shared/common-utils';
import { GiftCardType } from '@proxy/gift-cards';
import { MatChipInputEvent } from '@angular/material/chips';
import { GIFT_CARD_MIN_NUMBER_LENGTH } from 'src/app/shared/constants';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-gift-card-dialog',
  templateUrl: './gift-card-dialog.component.html',
})
export class GiftCardDialogComponent implements OnInit, OnDestroy {
  form: FormGroup;
  giftCardTypes = sortEnumValues(
    giftCardTypeOptions.filter(option => option.value === GiftCardType.Promotional),
  );
  giftCardStatus = sortEnumValues(giftCardStatusOptions);
  minDate: Date;
  values: ValueDto[];
  reasonValues: ValueDto[];
  cardNumbersControl = this.fb.control([]);
  separatorKeysCodes: number[] = [13, 188];
  destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<GiftCardDialogComponent>,
    private giftCardService: GiftCardService,
    @Inject(MAT_DIALOG_DATA) public data: GiftCardDto,
    private toaster: ToasterService,
  ) {}

  ngOnInit(): void {
    this.minDate = new Date();
    this.buildForm();
    this.getValues();
  }

  buildForm() {
    this.form = this.fb.group({
      giftCardType: [{ value: GiftCardType.Promotional, disabled: true }, Validators.required],
      cardNumber: [this.data?.cardNumber || '', Validators.required],
      customerName: [this.data?.customerName || ''],
      reasonValueId: [this.data?.reasonValueId || ''],
      expirationDate: [this.data?.expirationDate ? new Date(this.data?.expirationDate) : null],
      giftCardStatus: [this.data?.giftCardStatus || '', Validators.required],
      balance: [this.data?.balance || null, Validators.required],
      isBulkEntry: [false],
      qty: [],
      cardNumbers: this.cardNumbersControl,
    });

    this.form
      .get('isBulkEntry')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(isBulkEntry => {
        isBulkEntry
          ? this.form
              .get('qty')
              .addValidators([Validators.required, Validators.min(GIFT_CARD_MIN_NUMBER_LENGTH)])
          : this.form.get('qty').clearValidators();

        this.form.get('qty').updateValueAndValidity();
      });
  }

  getValues() {
    this.giftCardService
      .getGiftCardValueTypeList()
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        const { reasonList, preselectedReasonId } = res;
        this.reasonValues = reasonList;
        this.setFormValue('reasonValueId', preselectedReasonId);
      });
  }

  private setFormValue(controlName: string, value: any) {
    if (value) {
      this.form.get(controlName)?.setValue(value);
    }
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }

    this.dialogRef.close(this.form.getRawValue());
  }

  generateNumbers(): void {
    const baseNumber = parseInt(this.form.get('cardNumber')?.value, 10);
    const qty = this.form.get('qty')?.value;

    if (qty < GIFT_CARD_MIN_NUMBER_LENGTH || isNaN(baseNumber)) {
      this.toaster.error('::ValidationError:InvalidFormOrData');
      this.cardNumbersControl.setValue([]);
      return;
    }

    this.giftCardService
      .generateValidGiftCardNumbersByBaseNumberAndQuantity(baseNumber, qty)
      .pipe(takeUntil(this.destroy$))
      .subscribe(validNumbers => {
        this.cardNumbersControl.setValue(validNumbers);
      });
  }

  addCardNumber(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (!value) return;

    this.giftCardService
      .isExistsGiftCardNumber(value)
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        if (res) {
          this.toaster.error('::GiftCard:CardNumberAlreadyExists');
          return;
        }

        const cardNumberValue = parseInt(value, 10);
        const cardNumbers = this.cardNumbersControl.value;

        if (!isNaN(cardNumberValue) && !cardNumbers.includes(cardNumberValue)) {
          this.cardNumbersControl.setValue([...cardNumbers, cardNumberValue]);
        }

        event.chipInput!.clear();
        this.updateQty();
      });
  }

  updateQty(): void {
    const cardNumbersCount = this.cardNumbersControl.value.length;
    this.form.get('qty')?.setValue(cardNumbersCount);
  }

  removeCardNumbers(cardNumber: number): void {
    const cardNumbers = this.cardNumbersControl.value;
    const updatedCardNumbers = cardNumbers.filter((c: number) => c !== cardNumber);

    this.cardNumbersControl.setValue(updatedCardNumbers);
    this.updateQty();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
