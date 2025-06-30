import { ListService, PagedResultDto } from '@abp/ng.core';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  GiftCardService,
  GiftCardDto,
  giftCardTypeOptions,
  giftCardStatusOptions,
  CreateUpdateGiftCardDto,
} from '@proxy/gift-cards';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NgbDateNativeAdapter, NgbDateAdapter } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationService, Confirmation, ToasterService } from '@abp/ng.theme.shared';
import { PdfGeneratorService } from '../services/pdf-generator.service';
import { GiftCardCsvExportService } from '../services/gift-card-csv-export.service';
import { EXPORT_CONFIG } from '../export/export-config';
import { Router } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { GiftCardDialogComponent } from './gift-card-dialog/gift-card-dialog.component';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { FilterPagedAndSortedResultRequestDto } from '@proxy/shared';
import { Subject, take, takeUntil } from 'rxjs';
import { sortEnumValues } from '../shared/common-utils';

@Component({
  selector: 'app-gift-card',
  templateUrl: './gift-card.component.html',
  styleUrl: './gift-card.component.scss',
  providers: [ListService, { provide: NgbDateAdapter, useClass: NgbDateNativeAdapter }],
})
export class GiftCardComponent implements OnInit, OnDestroy {
  exportUrl = EXPORT_CONFIG.giftCardUrl;
  exportFieldList = [
    'tenantId',
    'giftCardType',
    'cardNumber',
    'reasonValueId',
    'customerId',
    'expirationDate',
    'statusType',
    'balance',
  ];
  columns: string[] = [
    'select',
    'cardNumber',
    'expirationDate',
    'balance',
    'giftCardType',
    'giftCardStatus',
    'actions',
  ];
  giftCard = { items: [], totalCount: 0 } as PagedResultDto<GiftCardDto>;
  selectedGiftCard = {} as GiftCardDto;
  form: FormGroup;
  isModalOpen: boolean = false;
  giftCardTypes = sortEnumValues(giftCardTypeOptions);
  statusTypes = sortEnumValues(giftCardStatusOptions);
  selectedGiftCards: string[] = [];
  filter: string = '';
  filterForm: FormGroup;
  destroy$ = new Subject<void>();

  constructor(
    public readonly list: ListService,
    private giftCardService: GiftCardService,
    private fb: FormBuilder,
    private confirmation: ConfirmationService,
    private pdfGeneratorService: PdfGeneratorService,
    private giftCardCsvExportService: GiftCardCsvExportService,
    private router: Router,
    public dialog: MatDialog,
    private toaster: ToasterService,
  ) {}

  ngOnInit() {
    this.filterForm = this.fb.group({
      giftCardNumber: [''],
      giftCardStatus: ['all'],
      giftCardType: ['all'],
      openBalance: ['', Validators.pattern(/^\d+(\.\d{1,2})?$/)],
    });

    this.loadGiftCards();
  }

  onFilter() {
    if (this.filterForm.valid) {
      this.list.page = 0;
      this.loadGiftCards();
    }
  }

  onResetFilters() {
    this.filterForm.reset({
      giftCardNumber: '',
      giftCardStatus: 'all',
      giftCardType: 'all',
      openBalance: '',
    });
    this.list.get();
  }

  createGiftCard() {
    const dialogRef = this.dialog.open(GiftCardDialogComponent, {
      width: '50%',
    });
    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return;
      }
      const { expirationDate, isBulkEntry, cardNumbers } = result;
      const formattedResult = {
        ...result,
        expirationDate: expirationDate
          ? `${expirationDate.getFullYear()}-${expirationDate.getMonth() + 1}-${expirationDate.getDate()}`
          : null,
      };

      if (isBulkEntry) {
        if (!cardNumbers || cardNumbers.length === 0) {
          this.toaster.error('::GiftCard:CardNumberRequired');
          return;
        }

        const bulkGiftCards: CreateUpdateGiftCardDto[] = cardNumbers.map((cardNumber: string) => ({
          ...formattedResult,
          cardNumber,
        }));

        this.bulkGiftCardEntry(bulkGiftCards);
      } else {
        this.create(formattedResult);
      }
    });
  }

  private create(formattedResult: any) {
    this.giftCardService
      .create(formattedResult)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadGiftCards();
      });
  }

  private bulkGiftCardEntry(giftCards: CreateUpdateGiftCardDto[]) {
    this.giftCardService
      .createBulkGiftCard(giftCards)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadGiftCards();
      });
  }

  editGiftCard(id: string) {
    this.router.navigate(['/giftCards/edit', id]);
  }

  isSelected(element: any): boolean {
    return this.selectedGiftCards.includes(element.id);
  }

  toggleSelection(element: any) {
    const index = this.selectedGiftCards.indexOf(element.id);
    if (index >= 0) {
      this.selectedGiftCards.splice(index, 1);
    } else {
      this.selectedGiftCards.push(element.id);
    }
  }

  toggleSelectAll(event: MatCheckboxChange) {
    if (event.checked) {
      this.selectedGiftCards = this.giftCard.items.map(item => item.id);
    } else {
      this.selectedGiftCards = [];
    }
  }

  isAllSelected(): boolean {
    return this.selectedGiftCards.length === this.giftCard.items.length;
  }

  isSomeSelected(): boolean {
    return (
      this.selectedGiftCards.length > 0 &&
      this.selectedGiftCards.length < this.giftCard.items.length
    );
  }

  deleteSelected() {
    if (this.selectedGiftCards.length === 0) {
      return;
    }
    this.confirmation.warn('::AreYouSureToDeleteSelected', '::AreYouSure').subscribe(status => {
      if (status === Confirmation.Status.confirm) {
        this.giftCardService
          .deleteSelectedBySelectedGiftCardIds(this.selectedGiftCards)
          .subscribe(() => {
            this.selectedGiftCards = [];
            this.loadGiftCards();
          });
      }
    });
  }

  delete(id: string) {
    this.confirmation.warn('::AreYouSureToDelete', '::AreYouSure').subscribe(status => {
      if (status === Confirmation.Status.confirm) {
        this.giftCardService.delete(id).subscribe(() => this.loadGiftCards());
      }
    });
  }

  buildForm() {
    this.form = this.fb.group({
      giftCardType: [this.selectedGiftCard.giftCardType || '', Validators.required],
      cardNumber: [this.selectedGiftCard.cardNumber || ''],
      reasonValueId: [this.selectedGiftCard.reasonValueId || ''],
      expirationDate: [
        this.selectedGiftCard.expirationDate
          ? new Date(this.selectedGiftCard.expirationDate)
          : null,
      ],
      statusType: [this.selectedGiftCard.giftCardStatus || '', Validators.required],
      balance: [this.selectedGiftCard.balance || null, Validators.required],
    });
  }

  onSearch(filter: string): void {
    this.filter = filter;
    this.giftCardService
      .getList({ filter: this.filter } as FilterPagedAndSortedResultRequestDto)
      .subscribe(response => {
        this.giftCard = response;
      });
  }

  downloadPdf(): void {
    this.pdfGeneratorService.generateGiftCardsPdf();
  }

  exportCsv() {
    this.giftCardCsvExportService.exportGiftCardsXlsx();
  }

  transactionList(giftCardId: string) {
    this.router.navigate([`/gift-card-transaction/${giftCardId}/transaction-list`]);
  }

  changePage(pageEvent: PageEvent) {
    this.list.page = pageEvent.pageIndex;
    this.loadGiftCards();
  }

  changeSort(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
    this.loadGiftCards();
  }

  save() {
    if (this.form.invalid) {
      return;
    }

    const request = this.selectedGiftCard.id
      ? this.giftCardService.update(this.selectedGiftCard.id, this.form.value)
      : this.giftCardService.create(this.form.value);

    request.subscribe(() => {
      this.isModalOpen = false;
      this.form.reset();
      this.loadGiftCards();
    });
  }

  private loadGiftCards() {
    const filters = {
      giftCardNumber: this.filterForm.value.giftCardNumber || undefined,
      giftCardStatus:
        this.filterForm.value.giftCardStatus !== 'all'
          ? this.filterForm.value.giftCardStatus
          : undefined,
      giftCardType:
        this.filterForm.value.giftCardType !== 'all'
          ? this.filterForm.value.giftCardType
          : undefined,
      openBalance: this.filterForm.value.openBalance || undefined,
    };
    this.list
      .hookToQuery(query =>
        this.giftCardService.getList({
          ...query,
          filter: filters?.giftCardNumber,
          giftCardStatus: filters?.giftCardStatus,
          giftCardType: filters?.giftCardType,
          openBalance: filters?.openBalance,
        }),
      )
      .pipe(take(1))
      .subscribe(response => {
        this.giftCard = response;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
