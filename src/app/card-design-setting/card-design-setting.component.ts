import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import jsPDF from 'jspdf';
import {
  FontFamilyType,
  fontFamilyTypeOptions,
  FontStyleType,
  fontStyleTypeOptions,
} from '@proxy/settings/store-specific-settings';
import { OccasionCode, occasionCodeOptions } from '@proxy/recipients';
import { occasionsTypeOptions } from '../models/occasionsType-enum';
import { CardDesignSettingService } from '@proxy/store-specific-settings';
import { ToasterService } from '@abp/ng.theme.shared';
import { Subject, takeUntil } from 'rxjs';
import { getEnumDisplayName } from '../shared/common-utils';

@Component({
  selector: 'app-card-design-setting',
  templateUrl: './card-design-setting.component.html',
  styleUrl: './card-design-setting.component.scss',
})
export class CardDesignSettingComponent implements OnInit, OnDestroy {
  cardDesignSettingForm!: FormGroup;
  pdfSrc?: SafeResourceUrl;
  fontFamilyOptions = fontFamilyTypeOptions;
  fontStyleOptions = fontStyleTypeOptions;
  filteredStyleOptions = fontStyleTypeOptions.filter(
    f => f.value !== FontStyleType.BoldItalic && f.value !== FontStyleType.Italic,
  );
  ocasionTypeOptions = occasionCodeOptions;
  private destroy$: Subject<void> = new Subject();

  constructor(
    private cardDesignSettingService: CardDesignSettingService,
    private fb: FormBuilder,
    private sanitizer: DomSanitizer,
    private toaster: ToasterService,
  ) {}

  ngOnInit(): void {
    this.getCardDesignSetting();
    this.initializeForm();
  }

  private getCardDesignSetting(): void {
    this.cardDesignSettingService
      .getCardDesignSetting()
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.cardDesignSettingForm.patchValue(response);
      });
  }

  private initializeForm() {
    this.cardDesignSettingForm = this.fb.group({
      templateWidth: [],
      templateHeight: [],
      previewCardMessage: ['', [Validators.maxLength(500)]],
      previewRecipientName: ['', [Validators.maxLength(500)]],
      occasionType: [],
      isCardMessage: [],
      isRecipient: [],
      isOccasion: [],
      cardFontFamily: [],
      cardFontStyle: [],
      cardMessageLeftMargin: [],
      cardMessageTopMargin: [10],
      cardMessageWidth: [80],
      cardFontSize: [12],
      cardMessageTextColor: [],
      cardLineHeight: [],
      recipientFontFamily: [],
      recipientFontStyle: [],
      recipientLeftMargin: [],
      recipientTopMargin: [],
      recipientWidth: [],
      recipientFontSize: [],
      recipientTextColor: [],
      occasionFontFamily: [],
      occasionFontStyle: [],
      occasionLeftMargin: [],
      occasionTopMargin: [],
      occasionWidth: [],
      occasionFontSize: [],
      occasionTextColor: [],
      isApplyToAllStore: [false],
    });
  }

  onSubmit() {
    if (this.cardDesignSettingForm.invalid) {
      this.toaster.error('CardDesignSetting:FormError');
      return;
    }

    const request = this.cardDesignSettingService.saveCardDesignSetting(
      this.cardDesignSettingForm.value,
    );
    request.pipe(takeUntil(this.destroy$)).subscribe({
      next: cardDesignSetting => {
        this.cardDesignSettingForm.patchValue(cardDesignSetting);
        this.toaster.success('::CardDesignSetting:Success');
      },
      error: err => {
        this.toaster.error(err.message);
      },
    });
  }

  onPreview() {
    if (!this.cardDesignSettingForm.valid) return;

    const formValue = this.cardDesignSettingForm.value;
    const doc = new jsPDF({
      unit: 'mm',
      format: [formValue.templateWidth || 127, formValue.templateHeight || 178],
    });

    if (formValue.isCardMessage && formValue.previewCardMessage) {
      const fontFamily = getEnumDisplayName(fontFamilyTypeOptions, formValue.cardFontFamily);
      const fontStyle = getEnumDisplayName(fontStyleTypeOptions, formValue.cardFontStyle);
      doc.setFont(fontFamily, fontStyle);
      doc.setFontSize(formValue.cardFontSize);
      doc.setTextColor(formValue.cardMessageTextColor);

      const lines = formValue.previewCardMessage.split('\n');
      const lineHeight = formValue.cardFontSize * (formValue.cardLineHeight || 1.2);

      let x = formValue.cardMessageLeftMargin;
      let y = formValue.cardMessageTopMargin;

      lines.forEach((line, index) => {
        doc.text(line, x, y + index * lineHeight, { maxWidth: formValue.cardMessageWidth });
      });
    }

    if (formValue.isRecipient && formValue.previewRecipientName) {
      const fontFamily = getEnumDisplayName(fontFamilyTypeOptions, formValue.recipientFontFamily);
      const fontStyle = getEnumDisplayName(fontStyleTypeOptions, formValue.recipientFontStyle);
      doc.setFont(fontFamily, fontStyle);
      doc.setFontSize(formValue.recipientFontSize);
      doc.setTextColor(formValue.recipientTextColor);

      doc.text(
        formValue.previewRecipientName,
        formValue.recipientLeftMargin,
        formValue.recipientTopMargin,
        { maxWidth: formValue.recipientWidth },
      );
    }

    if (formValue.isOccasion && formValue.occasionType > 0) {
      const fontFamily = getEnumDisplayName(fontFamilyTypeOptions, formValue.occasionFontFamily);
      const fontStyle = getEnumDisplayName(fontStyleTypeOptions, formValue.occasionFontStyle);
      const occasionType = getEnumDisplayName(occasionsTypeOptions, formValue.occasionType);
      doc.setFont(fontFamily, fontStyle);
      doc.setFontSize(formValue.occasionFontSize);
      doc.text(occasionType, formValue.occasionLeftMargin, formValue.occasionTopMargin, {
        maxWidth: formValue.occasionWidth,
      });
    }

    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    this.pdfSrc = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  onCardColorChange(color: string) {
    this.cardDesignSettingForm.get('cardMessageTextColor')?.setValue(color);
  }

  onRecipientColorChange(color: string) {
    this.cardDesignSettingForm.get('recipientTextColor')?.setValue(color);
  }

  onOccasionColorChange(color: string) {
    this.cardDesignSettingForm.get('occasionTextColor')?.setValue(color);
  }

  onFontFamilyChange(familyValue: FontFamilyType) {
    switch (familyValue) {
      case FontFamilyType.Helvetica:
      case FontFamilyType.Courier:
        this.filteredStyleOptions = this.fontStyleOptions.filter(
          f => f.value !== FontStyleType.BoldItalic && f.value !== FontStyleType.Italic,
        );
        break;

      case FontFamilyType.Symbol:
        this.filteredStyleOptions = this.fontStyleOptions.filter(
          f => f.value === FontStyleType.Normal,
        );
        break;

      case FontFamilyType.Times:
        this.filteredStyleOptions = this.fontStyleOptions.filter(
          f => f.value !== FontStyleType.BoldOblique && f.value !== FontStyleType.Oblique,
        );
        break;

      default:
        break;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
