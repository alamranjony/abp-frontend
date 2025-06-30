import { Injectable } from '@angular/core';
import { LocalizationService, PagedResultDto } from '@abp/ng.core';
import * as XLSX from 'xlsx';
import { MAX_RESULT_COUNT } from '../shared/constants';
import { Observable } from 'rxjs';
import { ToasterService } from '@abp/ng.theme.shared';
import {
  discountApplicationTypeOptions,
  DiscountDto,
  DiscountService,
  discountStatusOptions,
  discountTypeOptions,
} from '@proxy/discounts';

@Injectable({
  providedIn: 'root',
})
export class DiscountCsvExportService {
  constructor(
    private discountService: DiscountService,
    private toasterService: ToasterService,
    private localizationService: LocalizationService,
  ) {}

  private getEnumDisplayName(enumOptions: any[], enumValue: number): string {
    const option = enumOptions.find(option => option.value === enumValue);
    return option ? option.key : 'Unknown';
  }

  exportDiscountsXlsx(): void {
    const allDiscounts: DiscountDto[] = [];
    let skipCount = 0;
    const maxResultCount = MAX_RESULT_COUNT;

    const fetchBatch = () => {
      this.fetchDiscounts(skipCount, maxResultCount).subscribe(response => {
        allDiscounts.push(...response.items);
        if (response.totalCount > skipCount + maxResultCount) {
          skipCount += maxResultCount;
          fetchBatch();
        } else {
          if (allDiscounts.length === 0) {
            this.toasterService.warn('::Discount:EmptyDiscountsExportMessage');
            return;
          }
          this.exportToXlsx(allDiscounts);
        }
      });
    };

    fetchBatch();
  }

  fetchDiscounts(
    skipCount: number,
    maxResultCount: number,
  ): Observable<PagedResultDto<DiscountDto>> {
    return this.discountService.getList({
      skipCount: skipCount,
      maxResultCount: maxResultCount,
    });
  }

  async exportToXlsx(discounts: DiscountDto[]): Promise<void> {
    let dicountCodeColumnHeader = this.localizationService.instant(
      '::Discounts:DiscountCodeExcelColumn',
    );
    let dicountAmountColumnHeader = this.localizationService.instant(
      '::Discounts:DiscountAmountExcelColumn',
    );
    let dicountTypeColumnHeader = this.localizationService.instant(
      '::Discounts:DiscountTypeExcelColumn',
    );
    let dicountDescriptionColumnHeader = this.localizationService.instant(
      '::Discounts:DiscountDescriptionExcelColumn',
    );
    let dicountValidOnColumnHeader = this.localizationService.instant(
      '::Discounts:DiscountValidOnExcelColumn',
    );
    let dicountStatusColumnHeader = this.localizationService.instant(
      '::Discounts:DiscountStatusExcelColumn',
    );

    const headers: string[] = [
      dicountCodeColumnHeader,
      dicountAmountColumnHeader,
      dicountTypeColumnHeader,
      dicountDescriptionColumnHeader,
      dicountValidOnColumnHeader,
      dicountStatusColumnHeader,
    ];

    const rows = discounts.map(discount => [
      discount.discountCode,
      discount.discountAmount,
      this.getEnumDisplayName(discountTypeOptions, discount.discountType),
      discount.description || '',
      this.getEnumDisplayName(discountApplicationTypeOptions, discount.discountApplicationType),
      this.getEnumDisplayName(discountStatusOptions, discount.discountStatus),
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

    const filename = `Discount_${timestamp}.xlsx`;
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Discounts');
    XLSX.writeFile(workbook, filename);
  }
}
