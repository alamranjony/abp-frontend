import { PagedResultDto, ListService } from '@abp/ng.core';
import { ToasterService } from '@abp/ng.theme.shared';
import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { QueuedEmailDto, QueuedEmailsService } from '@proxy/queued-emails';
import { take } from 'rxjs';

@Component({
  selector: 'app-queued-emails',
  templateUrl: './queued-emails.component.html',
  providers: [ListService],
  styleUrls: ['./queued-emails.component.scss'],
})
export class QueuedEmailsComponent implements OnInit {
  queuedEmailsPaginatedResult = { items: [], totalCount: 0 } as PagedResultDto<QueuedEmailDto>;
  columns: string[] = [
    'from',
    'to',
    'subject',
    'body',
    'sentTries',
    'creationTime',
    'sentOnUtc',
    'actions',
  ];
  filter: string = '';

  constructor(
    public readonly list: ListService,
    private readonly queuedEmailsService: QueuedEmailsService,
    private toasterService: ToasterService,
  ) {}

  ngOnInit(): void {
    this.loadQueuedEmails();
  }

  changeSort(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
    this.loadQueuedEmails();
  }

  changePage(event: PageEvent) {
    this.list.page = event.pageIndex;
    this.loadQueuedEmails();
  }

  resendQueuedEmailById(id: string) {
    this.queuedEmailsService.resendQueuedEmailByQueuedEmailId(id).subscribe({
      next: () => {
        this.toasterService.success('::QueuedEmails:ResendSuccessMessage');
        this.loadQueuedEmails();
      },
      error: () => {
        this.toasterService.error('::EmailFailureMessage');
      },
    });
  }

  search(filter: string) {
    this.filter = filter;
    this.list.page = 0;
    this.loadQueuedEmails();
  }

  private loadQueuedEmails() {
    this.list
      .hookToQuery(query =>
        this.queuedEmailsService.getList({
          ...query,
          filter: this.filter,
        }),
      )
      .pipe(take(1))
      .subscribe(response => {
        this.queuedEmailsPaginatedResult = response;
      });
  }
}
