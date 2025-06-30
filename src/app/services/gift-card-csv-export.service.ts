import { Injectable } from '@angular/core';
import { PagedResultDto } from '@abp/ng.core';
import {
  GiftCardDto,
  GiftCardService,
  giftCardTypeOptions,
  giftCardStatusOptions,
} from '@proxy/gift-cards';
import * as XLSX from 'xlsx';
import { MAX_RESULT_COUNT } from '../shared/constants';
import { Observable } from 'rxjs';
import { ToasterService } from '@abp/ng.theme.shared';

@Injectable({
  providedIn: 'root',
})
export class GiftCardCsvExportService {
  constructor(
    private giftCardService: GiftCardService,
    private toasterService: ToasterService,
  ) {}

  private getEnumDisplayName(enumOptions: any[], enumValue: number): string {
    const option = enumOptions.find(option => option.value === enumValue);
    return option ? option.key : 'Unknown';
  }

  exportGiftCardsXlsx(): void {
    const allGiftCards: GiftCardDto[] = [];
    let skipCount = 0;
    const maxResultCount = MAX_RESULT_COUNT;

    const fetchBatch = () => {
      this.fetchGiftCards(skipCount, maxResultCount).subscribe(response => {
        allGiftCards.push(...response.items);
        if (response.totalCount > skipCount + maxResultCount) {
          skipCount += maxResultCount;
          fetchBatch();
        } else {
          if (allGiftCards.length === 0) {
            this.toasterService.warn('No gift card to export');
            return;
          }
          this.exportToXlsx(allGiftCards);
        }
      });
    };

    fetchBatch();
  }

  fetchGiftCards(
    skipCount: number,
    maxResultCount: number,
  ): Observable<PagedResultDto<GiftCardDto>> {
    return this.giftCardService.getList({
      skipCount: skipCount,
      maxResultCount: maxResultCount,
    });
  }

  async exportToXlsx(giftCards: GiftCardDto[]): Promise<void> {
    const headers: string[] = [
      'Gift Card Number',
      'Reason',
      'Customer Name',
      'Starting Amount',
      'Expiration Date',
      'Balance($)',
      'Gift Card Type',
      'Status',
    ];

    const rows = giftCards.map(giftCard => [
      giftCard.cardNumber,
      giftCard.reason || '',
      giftCard.customerName || '',
      giftCard.startingAmount?.toString() || '',
      giftCard.expirationDate ? new Date(giftCard.expirationDate).toLocaleDateString() : '',
      giftCard.balance?.toString() || '',
      this.getEnumDisplayName(giftCardTypeOptions, giftCard.giftCardType),
      this.getEnumDisplayName(giftCardStatusOptions, giftCard.giftCardStatus),
    ]);

    const timestamp = new Date()
      .toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })
      .replace(/[/, ]/g, '_')
      .replace(/:/g, '_');

    const filename = `Gift_Card_${timestamp}.xlsx`;
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'GiftCards');
    XLSX.writeFile(workbook, filename);
  }
}
