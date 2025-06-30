import { Component, OnInit } from '@angular/core';
import { ListService, PagedResultDto } from '@abp/ng.core';
import { Sort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';
import { RecipientDto, RecipientService } from '@proxy/recipients';
import { Confirmation, ConfirmationService, ToasterService } from '@abp/ng.theme.shared';
import { DialogUtilService } from '../shared/dialog-util.service';
import { RecipientDialogComponent } from './recipient-dialog/recipient-dialog.component';
import { FilterPagedAndSortedResultRequestDto } from '@proxy/shared';

@Component({
  selector: 'app-recipients',
  templateUrl: './recipient.component.html',
  styleUrl: './recipient.component.scss',
  providers: [ListService],
})
export class RecipientComponent implements OnInit {
  recipients: PagedResultDto<RecipientDto> = { items: [], totalCount: 0 };
  columns: string[] = ['firstName', 'lastName', 'email', 'number', 'actions'];
  filter: string = '';

  constructor(
    public readonly list: ListService,
    private recipientService: RecipientService,
    private toasterService: ToasterService,
    private dialogUtil: DialogUtilService,
    private confirmation: ConfirmationService,
  ) {}

  ngOnInit(): void {
    const recipientStreamCreator = query => this.recipientService.getList(query);
    this.list.hookToQuery(recipientStreamCreator).subscribe(response => {
      this.recipients = response;
    });
  }

  handleServiceResponse(successMessage: string, errorMessage: string) {
    return {
      next: () => {
        this.toasterService.success(successMessage);
        this.list.get();
      },
      error: () => this.toasterService.error(errorMessage),
    };
  }

  openRecipientDialog(data: any, onSave: (result: any) => void) {
    const dialogRef = this.dialogUtil.openDialog(RecipientDialogComponent, data);
    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return;
      }
      onSave(result);
    });
  }

  createRecipient() {
    this.openRecipientDialog({ isEditMode: false }, result => {
      this.recipientService
        .create(result)
        .subscribe(
          this.handleServiceResponse(
            '::Recipient:RecipientCreated',
            '::Recipient:RecipientCreateError',
          ),
        );
    });
  }

  editRecipient(id: string) {
    this.recipientService.get(id).subscribe(result => {
      if (!result) {
        return;
      }

      this.openRecipientDialog({ ...result, isEditMode: true }, updatedResult => {
        this.recipientService
          .update(id, updatedResult)
          .subscribe(
            this.handleServiceResponse(
              '::Recipient:RecipientUpdated',
              '::Recipient:RecipientUpdateError',
            ),
          );
      });
    });
  }

  search(filter: string) {
    this.filter = filter;
    this.recipientService
      .getList({ filter: this.filter } as FilterPagedAndSortedResultRequestDto)
      .subscribe(response => {
        this.recipients = response;
      });
  }

  deleteMessageShortCut(id: string) {
    this.confirmation.warn('::AreYouSureToDelete', '::AreYouSure').subscribe(status => {
      if (status !== Confirmation.Status.confirm) {
        return;
      }

      this.recipientService
        .delete(id)
        .subscribe(
          this.handleServiceResponse(
            '::Recipient:RecipientDeleted',
            '::Recipient:RecipientDeleteError',
          ),
        );
    });
  }

  changeSort(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
  }

  changePage(event: PageEvent) {
    this.list.page = event.pageIndex;
  }
}
