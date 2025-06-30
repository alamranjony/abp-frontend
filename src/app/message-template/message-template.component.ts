import { PagedResultDto, ListService } from '@abp/ng.core';
import { ConfirmationService, ToasterService, Confirmation } from '@abp/ng.theme.shared';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MessageTemplateDto, MessageTemplateService } from '@proxy/messages';
import { take } from 'rxjs';
import { CreateUpdateMessageTemplateComponent } from './create-update-message-template/create-update-message-template.component';

@Component({
  selector: 'app-message-template',
  templateUrl: './message-template.component.html',
  styleUrls: ['./message-template.component.scss'],
  providers: [ListService],
})
export class MessageTemplateComponent implements OnInit {
  messageTemplatesPaginatedResult = {
    items: [],
    totalCount: 0,
  } as PagedResultDto<MessageTemplateDto>;
  columns: string[] = ['name', 'subject', 'body', 'actions'];
  filter: string = '';

  constructor(
    public readonly list: ListService,
    private readonly messageTemplateService: MessageTemplateService,
    private readonly confirmation: ConfirmationService,
    private dialog: MatDialog,
    private toasterSercive: ToasterService,
  ) {}

  ngOnInit(): void {
    this.loadMessageTemplates();
  }

  addMessageTemplate() {
    const dialogRef = this.dialog.open(CreateUpdateMessageTemplateComponent, {
      width: '40%',
      data: { isEditMode: false },
      enterAnimationDuration: 250,
      exitAnimationDuration: 250,
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.messageTemplateService.create(result).subscribe({
          next: () => {
            this.loadMessageTemplates();
            this.toasterSercive.success('::MessageTemplatesCreateSuccessMessage');
          },
          error: () => {
            this.toasterSercive.error('::MessageTemplatesSaveErrorMessage');
          },
        });
      }
    });
  }

  editMesssageTemplateById(id: string, name: string) {
    this.messageTemplateService
      .getMessageTemplateWithAllowedTokenById(id)
      .subscribe((response: MessageTemplateDto) => {
        const dialogRef = this.dialog.open(CreateUpdateMessageTemplateComponent, {
          width: '80%',
          data: { ...response, isEditMode: true },
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.messageTemplateService.update(id, result).subscribe({
              next: () => {
                this.loadMessageTemplates();
                this.toasterSercive.success('::MessageTemplatesUpdateSuccessMessage');
              },
              error: () => {
                this.toasterSercive.error('::MessageTemplatesSaveErrorMessage');
              },
            });
          }
        });
      });
  }

  delete(id: string) {
    this.confirmation.warn('::AreYouSureToDelete', '::AreYouSure').subscribe(status => {
      if (status === Confirmation.Status.confirm) {
        this.messageTemplateService.delete(id).subscribe({
          next: () => {
            this.loadMessageTemplates();
            this.toasterSercive.success('::MessageTemplatesDeleteSuccessMessage');
          },
          error: () => {
            this.toasterSercive.error('::MessageTemplatesDeleteErrorMessage');
          },
        });
      }
    });
  }

  changeSort(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
    this.loadMessageTemplates();
  }

  changePage(event: PageEvent) {
    this.list.page = event.pageIndex;
    this.loadMessageTemplates();
  }

  search(filter: string) {
    this.filter = filter;
    this.list.page = 0;
    this.loadMessageTemplates();
  }

  private loadMessageTemplates() {
    this.list
      .hookToQuery(query =>
        this.messageTemplateService.getList({
          ...query,
          filter: this.filter,
        }),
      )
      .pipe(take(1))
      .subscribe(result => {
        this.messageTemplatesPaginatedResult = result;
      });
  }
}
