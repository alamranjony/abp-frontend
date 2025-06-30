import { PagedResultDto, ListService } from '@abp/ng.core';
import { ToasterService } from '@abp/ng.theme.shared';
import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import {
  discountApplicationTypeOptions,
  DiscountService,
  discountStatusOptions,
  discountTypeOptions,
} from '@proxy/discounts';
import { FilterPagedAndSortedResultRequestDto } from '@proxy/shared';
import { DiscountItem } from './discounts.model';
import { DiscountCsvExportService } from '../services/discount-csv-export.service';
import { take } from 'rxjs';
import { sortEnumValues } from '../shared/common-utils';

@Component({
  selector: 'app-discounts',
  templateUrl: './discounts.component.html',
  styleUrls: ['./discounts.component.scss'],
  providers: [ListService],
})
export class DiscountsComponent implements OnInit {
  discountsPaginatedResult = { items: [], totalCount: 0 } as PagedResultDto<DiscountItem>;
  discountTypeOptions = sortEnumValues(discountTypeOptions);
  discountStatusOptions = sortEnumValues(discountStatusOptions);
  discountApplicationTypeOptions = sortEnumValues(discountApplicationTypeOptions);

  columns: string[] = [
    'discountCode',
    'discountAmount',
    'discountType',
    'description',
    'discountApplicationType',
    'discountStatus',
    'actions',
  ];
  filter: string = '';
  exportFieldList = [
    'discountCode',
    'discountAmount',
    'discountType',
    'description',
    'discountApplicationType',
    'discountStatus',
  ];

  constructor(
    public readonly list: ListService,
    private readonly discountService: DiscountService,
    private toasterService: ToasterService,
    private discountCsvExportService: DiscountCsvExportService,
  ) {}

  ngOnInit(): void {
    this.getAllDiscounts();
  }

  changeSort(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
    this.getAllDiscounts();
  }

  changePage(event: PageEvent) {
    this.list.page = event.pageIndex;
    this.getAllDiscounts();
  }

  getAllDiscounts() {
    const discountStreamCreator = (query: FilterPagedAndSortedResultRequestDto) =>
      this.discountService.getList({ ...query, filter: this.filter });

    this.list
      .hookToQuery(discountStreamCreator)
      .pipe(take(1))
      .subscribe(response => {
        this.discountsPaginatedResult = {
          totalCount: response.totalCount,
          items: response.items.map(x => {
            return {
              ...x,
              discountTypeName: this.getObjectKeyByValue(discountTypeOptions, x.discountType),
              discountStatusName: this.getObjectKeyByValue(discountStatusOptions, x.discountStatus),
              discountApplicationTypeName: this.getObjectKeyByValue(
                discountApplicationTypeOptions,
                x.discountApplicationType,
              ),
            };
          }),
        };
      });
  }

  getObjectKeyByValue(data: Array<{ key: string; value: number }>, value: number): string {
    return data.find(item => item.value === value)?.key;
  }

  search(filter: string) {
    this.filter = filter;
    this.list.page = 0;
    this.getAllDiscounts();
  }

  onClickDeleteBtn(discountId: string) {
    this.discountService.delete(discountId).subscribe({
      next: () => {
        this.toasterService.success('::Discount:DeleteSuccessMessage');
        this.getAllDiscounts();
      },
      error: () => {
        this.toasterService.error('::Discount:DeleteErrorMessage');
      },
    });
  }

  exportCsv() {
    this.discountCsvExportService.exportDiscountsXlsx();
  }
}
