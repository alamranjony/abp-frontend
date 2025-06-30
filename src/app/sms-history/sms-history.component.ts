import { Component, OnInit } from '@angular/core';
import { ListService, PagedResultDto } from '@abp/ng.core';
import { SmsHistoryDto, SmsHistoryService, smsStatusOptions } from '@proxy/sms-histories';
import { FilterPagedAndSortedResultRequestDto } from '@proxy/shared';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { zoneTypeOptions } from '@proxy/deliveries';
import { take } from 'rxjs';

@Component({
  selector: 'app-sms-history',
  templateUrl: './sms-history.component.html',
  styleUrl: './sms-history.component.scss',
  providers: [ListService],
})
export class SmsHistoryComponent implements OnInit {
  smsHistories: PagedResultDto<SmsHistoryDto> = {
    items: [],
    totalCount: 0,
  } as PagedResultDto<SmsHistoryDto>;
  searchParam: string = '';
  status: number = null;
  columns: string[] = ['recipientNumber', 'status', 'sentTime', 'tryCount'];
  statusOptions = smsStatusOptions;
  constructor(
    public readonly listService: ListService<FilterPagedAndSortedResultRequestDto>,
    private smsHistoryService: SmsHistoryService,
  ) {}

  ngOnInit(): void {
    this.loadSmsHistory();
  }

  loadSmsHistory() {
    this.listService
      .hookToQuery(query =>
        this.smsHistoryService.getList({
          ...query,
          filter: this.searchParam,
          status: this.status > 0 ? this.status : null,
        }),
      )
      .pipe(take(1))
      .subscribe(result => {
        this.smsHistories = result;
      });
  }

  clearSearch(): void {
    this.searchParam = '';
    this.loadSmsHistory();
  }

  changePage(pageEvent: PageEvent) {
    this.listService.page = pageEvent.pageIndex;
    this.loadSmsHistory();
  }

  changeSort(sort: Sort) {
    this.listService.sortKey = sort.active;
    this.listService.sortOrder = sort.direction;
    this.loadSmsHistory();
  }

  onChangeStatus() {
    this.loadSmsHistory();
  }

  protected readonly zoneTypes = zoneTypeOptions;
}
