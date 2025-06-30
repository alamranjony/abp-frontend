import { Component, OnInit } from '@angular/core';
import { ListService, PagedResultDto } from '@abp/ng.core';
import { ConfirmationService, Confirmation } from '@abp/ng.theme.shared';
import { SmsTemplateService, SmsTemplateDto } from '@proxy/sms-templates';
import { ToasterService } from '@abp/ng.theme.shared';
import { Sort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';
import { SmsTemplateDialogComponent } from './sms-template-dialogue/sms-template-dialogue.component';
import { FilterPagedAndSortedResultRequestDto } from '@proxy/shared';
import { DialogUtilService } from '../shared/dialog-util.service';
import { take } from 'rxjs';

@Component({
  selector: 'app-sms-template',
  templateUrl: './sms-template.component.html',
  styleUrl: './sms-template.component.scss',
  providers: [ListService],
})
export class SmsTemplateComponent implements OnInit {
  smsTemplates = { items: [], totalCount: 0 } as PagedResultDto<SmsTemplateDto>;
  filter: string = '';
  columns: string[] = ['systemName', 'displayName', 'actions'];

  constructor(
    public readonly list: ListService<SmsTemplateDto>,
    private smsTemplateService: SmsTemplateService,
    private confirmation: ConfirmationService,
    private toasterService: ToasterService,
    private dialogUtil: DialogUtilService,
  ) {}

  ngOnInit(): void {
    this.loadSmsTemplates();
  }

  private loadSmsTemplates() {
    this.list
      .hookToQuery(query =>
        this.smsTemplateService.getList({
          ...query,
          filter: this.filter,
        } as FilterPagedAndSortedResultRequestDto),
      )
      .pipe(take(1))
      .subscribe(response => {
        this.smsTemplates = response;
      });
  }

  search(filter: string) {
    this.filter = filter;
    this.list.page = 0;
    this.loadSmsTemplates();
  }

  addSmsTemplate() {
    const dialogRef = this.dialogUtil.openDialog(SmsTemplateDialogComponent, { isEditMode: false });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.smsTemplateService.create(result).subscribe({
          next: () => {
            this.onSuccess('::SmsTemplate:SuccessfullyAdded');
          },
          error: () => {
            this.onError('::SmsTemplate:ErrorSaving');
          },
        });
      }
    });
  }

  editSmsTemplate(id: string) {
    this.smsTemplateService.get(id).subscribe(response => {
      const dialogRef = this.dialogUtil.openDialog(SmsTemplateDialogComponent, {
        ...response,
        isEditMode: true,
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.smsTemplateService.update(id, result).subscribe({
            next: () => {
              this.onSuccess('::SmsTemplate:SuccessfullyUpdated');
            },
            error: () => {
              this.onError('::SmsTemplate:ErrorOccured');
            },
          });
        }
      });
    });
  }

  deleteSmsTemplate(id: string) {
    this.confirmation.warn('::AreYouSureToDelete', '::AreYouSure').subscribe(status => {
      if (status === Confirmation.Status.confirm) {
        this.smsTemplateService.delete(id).subscribe({
          next: () => {
            this.onSuccess('::SmsTemplate:SuccessfullyDeleted');
          },
          error: () => {
            this.onError('::SmsTemplate:ErrorOccured');
          },
        });
      }
    });
  }

  changeSort(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
    this.loadSmsTemplates();
  }

  changePage(event: PageEvent) {
    this.list.page = event.pageIndex;
    this.loadSmsTemplates();
  }

  private onSuccess(message: string) {
    this.filter = '';
    this.toasterService.success(message);
    this.loadSmsTemplates();
  }

  private onError(message: string) {
    this.toasterService.error(message);
  }
}
