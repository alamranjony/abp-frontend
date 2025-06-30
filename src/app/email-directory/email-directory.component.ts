import { ListService, PagedResultDto } from '@abp/ng.core';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  EmailDirectoryService,
  EmailDirectoryDto,
  CreateUpdateEmailDirectoryDto,
} from '@proxy/email-directories';
import { ConfirmationService, Confirmation, ToasterService } from '@abp/ng.theme.shared';
import { EmailDirectoryDialogComponent } from './email-directory-dialog/email-directory-dialog.component';
import { PageEvent } from '@angular/material/paginator';
import { DialogUtilService } from '../shared/dialog-util.service';

@Component({
  selector: 'app-email-directory',
  templateUrl: './email-directory.component.html',
  styleUrl: './email-directory.component.scss',
  providers: [ListService],
})
export class EmailDirectoryComponent implements OnInit {
  @Input() entityId?: string;
  @Input() entityName?: string;
  @Output() createdEmailDirectoriesEvent = new EventEmitter<CreateUpdateEmailDirectoryDto[]>();

  emailDirectories = { items: [], totalCount: 0 } as PagedResultDto<EmailDirectoryDto>;
  columns: string[] = [
    'email',
    'isPrimary',
    'optOutForMarketing',
    'optForDirectMarketing',
    'actions',
  ];

  constructor(
    public readonly list: ListService,
    private emailsDirectoryService: EmailDirectoryService,
    private confirmation: ConfirmationService,
    private toasterService: ToasterService,
    private dialogUtil: DialogUtilService,
  ) {}

  ngOnInit() {
    if (!this.entityName) {
      this.columns.push('entityName');
    }

    this.loadCustomerEmailDirectories();
  }

  private loadCustomerEmailDirectories() {
    if (!this.entityId) return;

    const emailDirectoryStreamCreator = query =>
      this.emailsDirectoryService.getFilteredList({
        ...query,
        entityId: this.entityId,
        entityName: this.entityName,
      });
    this.list.hookToQuery(emailDirectoryStreamCreator).subscribe(response => {
      this.emailDirectories = response;
    });
  }

  createEmail() {
    this.openEmailDialog(false);
  }

  private openEmailDialog(
    isEditMode: boolean,
    data: EmailDirectoryDto = {
      entityId: this.entityId,
      entityName: this.entityName,
      email: '',
      isPrimary: false,
      optOutForMarketing: false,
      optForDirectMarketing: false,
    },
    id?: string,
  ) {
    const dialogRef = this.dialogUtil.openDialog(EmailDirectoryDialogComponent, {
      ...data,
      isEditMode,
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        isEditMode ? this.onUpdateEmail(id!, result) : this.onCreateEmail(result);
      }
    });
  }

  private onCreateEmail(result: any) {
    if (!this.entityId) {
      result.id = crypto.randomUUID();
      this.updateLocalEmailList([...this.emailDirectories.items, result]);
      return;
    }

    this.create(result);
  }

  private create(result: any) {
    this.emailsDirectoryService.create(result).subscribe({
      next: () => {
        this.onSuccess('::CreateSuccess');
        this.updateLocalEmailList([...this.emailDirectories.items, result]);
      },
      error: () => this.toasterService.error('::ErrorOccurred'),
    });
  }

  private onUpdateEmail(id: string, result: any) {
    if (!this.entityId) {
      this.updateLocalEmailList(
        this.emailDirectories.items.map(item => (item.id === id ? result : item)),
      );
      return;
    }

    this.update(id, result);
  }

  private update(id: string, result: any) {
    this.emailsDirectoryService.update(id, result).subscribe({
      next: () => {
        this.onSuccess('::UpdateSuccess');
        this.updateLocalEmailList(
          this.emailDirectories.items.map(item => (item.id === id ? result : item)),
        );
      },
      error: () => this.toasterService.error('::ErrorOccurred'),
    });
  }

  editEmail(id: string) {
    if (!this.entityId) {
      const emailDirectory = this.emailDirectories.items.find(item => item.id === id);
      if (emailDirectory) {
        this.openEmailDialog(true, emailDirectory, id);
      }
      return;
    }

    this.emailsDirectoryService.get(id).subscribe(result => {
      this.openEmailDialog(true, result, id);
    });
  }

  onDelete(id: string) {
    this.confirmation.warn('::AreYouSureToDelete', '::AreYouSure').subscribe(status => {
      if (status === Confirmation.Status.confirm) {
        if (!this.entityId) {
          this.updateLocalEmailList(this.emailDirectories.items.filter(item => item.id !== id));
          this.onSuccess('::DeleteSuccess');
          return;
        }

        this.delete(id);
      }
    });
  }

  private delete(id: string) {
    this.emailsDirectoryService.delete(id).subscribe({
      next: () => {
        this.onSuccess('::DeleteSuccess');
        this.updateLocalEmailList(this.emailDirectories.items.filter(item => item.id !== id));
      },
      error: () => this.toasterService.error('::ErrorOccurred'),
    });
  }

  private onSuccess(message: string) {
    this.toasterService.success(message);
    this.list.get();
  }

  private updateLocalEmailList(items: EmailDirectoryDto[]) {
    this.emailDirectories = { ...this.emailDirectories, items };
    this.createdEmailDirectoriesEvent.emit(this.mapToEmailDirectoryDtos(items));
  }

  private mapToEmailDirectoryDtos(items: EmailDirectoryDto[]): CreateUpdateEmailDirectoryDto[] {
    return items.map(
      ({ entityId, email, isPrimary, optOutForMarketing, optForDirectMarketing, entityName }) => ({
        entityId,
        email,
        isPrimary,
        optOutForMarketing,
        optForDirectMarketing,
        entityName,
      }),
    );
  }

  changePage(event: PageEvent) {
    this.list.page = event.pageIndex;
  }
}
