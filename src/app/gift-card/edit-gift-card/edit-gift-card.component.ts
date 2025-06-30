import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  GiftCardService,
  GiftCardDto,
  GiftCardTransactionDto,
  GiftCardTransactionService,
  giftCardTypeOptions,
  giftCardStatusOptions,
} from '@proxy/gift-cards';
import { ListService } from '@abp/ng.core';
import { NgbDateNativeAdapter, NgbDateAdapter } from '@ng-bootstrap/ng-bootstrap';
import { MatDialog } from '@angular/material/dialog';
import { RenewGiftCardDialogComponent } from '../renew-gift-card-dialog/renew-gift-card-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { ValueDto } from '@proxy/values';
import { ValueTypeSettingService } from '@proxy/value-type-settings';
import { GiftCardSettingsDto } from '@proxy/value-type-settings/gift-cards';
import { ToasterService } from '@abp/ng.theme.shared';
import { sortEnumValues } from 'src/app/shared/common-utils';

@Component({
  selector: 'app-edit-gift-card',
  templateUrl: './edit-gift-card.component.html',
  providers: [ListService, { provide: NgbDateAdapter, useClass: NgbDateNativeAdapter }],
})
export class EditGiftCardComponent implements OnInit, AfterViewInit {
  form: FormGroup;
  renewForm: FormGroup;
  displayedColumns: string[] = [
    'date',
    'transactionId',
    'giftCardActionType',
    'usedAmount',
    'startingAmount',
    'balance',
  ];
  isRenewModalOpen = false;
  giftCardTypes = sortEnumValues(giftCardTypeOptions);
  giftCardStatus = sortEnumValues(giftCardStatusOptions);
  giftCardId: string;
  selectedGiftCard: GiftCardDto;
  giftCardSettings: GiftCardSettingsDto;
  values: ValueDto[];
  reasonValues: ValueDto[];
  transactions = new MatTableDataSource<GiftCardTransactionDto>([]);
  minDate: Date;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private giftCardService: GiftCardService,
    private giftCardTransactionService: GiftCardTransactionService,
    private dialog: MatDialog,
    private valueTypeSettingService: ValueTypeSettingService,
    private toasterService: ToasterService,
  ) {}

  ngOnInit() {
    this.minDate = new Date();
    this.giftCardId = this.route.snapshot.paramMap.get('id');
    this.loadGiftCardData();
  }

  ngAfterViewInit() {
    this.transactions.paginator = this.paginator;
  }

  loadGiftCardData() {
    this.giftCardService.get(this.giftCardId).subscribe(card => {
      this.selectedGiftCard = card;
      this.buildForm();
      this.form.patchValue({
        balance: this.selectedGiftCard.balance,
        giftCardType: this.selectedGiftCard.giftCardType,
        cardNumber: this.selectedGiftCard.cardNumber,
        reasonValueId: this.selectedGiftCard.reasonValueId,
        customerName: this.selectedGiftCard.customerName,
        expirationDate: this.selectedGiftCard.expirationDate
          ? new Date(this.selectedGiftCard.expirationDate)
          : null,
        giftCardStatus: this.selectedGiftCard.giftCardStatus,
      });
      this.form.markAllAsTouched();
      this.getGiftCardSettings();
      this.getValues();
      this.loadTransactions();
    });
  }

  getGiftCardSettings(): void {
    this.valueTypeSettingService.getGiftCardValueTypeSetting().subscribe(res => {
      this.giftCardSettings = res;
    });
  }

  getValues() {
    this.giftCardService.getGiftCardValueTypeList().subscribe(res => {
      const { reasonList } = res;
      this.values = reasonList;
      this.getReasonValues();
    });
  }

  getReasonValues() {
    this.reasonValues = this.values.filter(v => v.valueTypeId === this.giftCardSettings.reason);
  }

  loadTransactions() {
    this.giftCardTransactionService.getTransactionList(this.giftCardId).subscribe(response => {
      this.transactions.data = response.items;
    });
  }

  renewGiftCard() {
    if (this.selectedGiftCard.giftCardType == 2) {
      this.toasterService.warn('Promotional gift cards cannot be renewed.');
      return;
    }
    const dialogRef = this.dialog.open(RenewGiftCardDialogComponent, {
      width: '600px',
      data: { giftCardId: this.selectedGiftCard.id },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return;
      }
      this.saveRenewal(result);
    });
  }

  saveRenewal(renewalData: any) {
    const { extendedTillDate } = renewalData;
    const renewalRequest = {
      giftCardId: this.selectedGiftCard.id,
      ...renewalData,
      extendedTillDate: extendedTillDate
        ? `${extendedTillDate.getFullYear()}-${extendedTillDate.getMonth() + 1}-${extendedTillDate.getDate()}`
        : null,
    };

    this.giftCardService.renew(renewalRequest).subscribe(() => {
      this.loadGiftCardData();
    });
  }

  buildForm() {
    this.form = this.fb.group({
      giftCardType: [
        { value: this.selectedGiftCard.giftCardType || '', disabled: true },
        Validators.required,
      ],
      cardNumber: [{ value: this.selectedGiftCard.cardNumber || '', disabled: true }],
      reasonValueId: [{ value: this.selectedGiftCard.reasonValueId || '', disabled: true }],
      customerName: [{ value: this.selectedGiftCard.customerName || '', disabled: true }],
      expirationDate: [
        this.selectedGiftCard.expirationDate
          ? new Date(this.selectedGiftCard.expirationDate)
          : null,
      ],
      giftCardStatus: [this.selectedGiftCard.giftCardStatus || '', Validators.required],
      balance: [
        { value: this.selectedGiftCard.balance || null, disabled: true },
        Validators.required,
      ],
    });
  }

  buildRenewForm() {
    this.renewForm = this.fb.group({
      extendedTillDate: [null, Validators.required],
      renewalAmount: [null, Validators.required],
    });
  }

  save() {
    if (this.form.invalid) {
      this.toasterService.error('::ValidationError:InvalidFormOrData');
      return;
    }

    this.form.get('giftCardType').enable();
    this.form.get('cardNumber').enable();
    this.form.get('reasonValueId').enable();
    this.form.get('customerName').enable();
    this.form.get('balance').enable();

    const expirationDate = this.form.get('expirationDate')?.value;
    const formattedFormValue = {
      ...this.form.value,
      expirationDate: expirationDate
        ? `${expirationDate.getFullYear()}-${expirationDate.getMonth() + 1}-${expirationDate.getDate()}`
        : null,
    };

    const request = this.giftCardId
      ? this.giftCardService.update(this.giftCardId, formattedFormValue)
      : this.giftCardService.create(this.form.value);

    request.subscribe(() => {
      this.router.navigate(['/giftCards']);
    });
  }

  cancel() {
    this.router.navigate(['/giftCards']);
  }
}
