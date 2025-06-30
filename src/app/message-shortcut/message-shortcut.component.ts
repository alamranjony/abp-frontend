import { ListService, PagedResultDto } from '@abp/ng.core';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { ConfirmationService, Confirmation, ToasterService } from '@abp/ng.theme.shared';
import { MessageShortCutService, MessageShortCutDto } from '@proxy/message-short-cuts';
import { Sort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';
import { MessageShortcutDialogComponent } from './message-shortcut-dialog/message-shortcut-dialog.component';
import { MessageShortcutDialogData } from './message-shortcut-dialog/message-shortcut-dialog-data.interface';
import { DialogUtilService } from '../shared/dialog-util.service';
import { EXPORT_CONFIG } from '../export/export-config';
import { take } from 'rxjs';

@Component({
  selector: 'app-message-shortcut',
  templateUrl: './message-shortcut.component.html',
  styleUrl: './message-shortcut.component.scss',
  providers: [ListService],
})
export class MessageShortcutComponent implements OnInit {
  messageShortcut = { items: [], totalCount: 0 } as PagedResultDto<MessageShortCutDto>;
  form: FormGroup;
  selectedMessage: MessageShortCutDto = {} as MessageShortCutDto;
  filter: string = '';
  columns: string[] = ['shortCut', 'description', 'actions'];
  exportUrl = EXPORT_CONFIG.messageShortcutsUrl;
  exportFieldList = ['shortCut', 'description'];

  constructor(
    public readonly list: ListService,
    private messageShortcutService: MessageShortCutService,
    private fb: FormBuilder,
    private confirmation: ConfirmationService,
    private toasterService: ToasterService,
    private dialogUtil: DialogUtilService,
  ) {}

  ngOnInit() {
    this.loadMessageShortcuts();
  }

  handleServiceResponse(successMessage: string, errorMessage: string) {
    return {
      next: () => {
        this.toasterService.success(successMessage);
        this.loadMessageShortcuts();
      },
      error: () => this.toasterService.error(errorMessage),
    };
  }

  openMessageShortcutDialog(data: MessageShortcutDialogData, onSave: (result: any) => void) {
    const dialogRef = this.dialogUtil.openDialog(MessageShortcutDialogComponent, data);
    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return;
      }
      onSave(result);
    });
  }

  createMessageShortCut() {
    this.openMessageShortcutDialog({ isEditMode: false }, result => {
      this.messageShortcutService
        .create(result)
        .subscribe(
          this.handleServiceResponse(
            '::MessageShortcut:ShortcutCreated',
            '::MessageShortcut:ShortcutCreateError',
          ),
        );
    });
  }

  editMessageShortCut(id: string) {
    this.messageShortcutService.get(id).subscribe(result => {
      if (!result) {
        return;
      }

      this.openMessageShortcutDialog({ ...result, isEditMode: true }, updatedResult => {
        this.messageShortcutService
          .update(id, updatedResult)
          .subscribe(
            this.handleServiceResponse(
              '::MessageShortcut:ShortcutUpdated',
              '::MessageShortcut:ShortcutUpdateError',
            ),
          );
      });
    });
  }

  search(filter: string) {
    this.filter = filter;
    this.list.page = 0;
    this.loadMessageShortcuts();
  }

  deleteMessageShortCut(id: string) {
    this.confirmation.warn('::AreYouSureToDelete', '::AreYouSure').subscribe(status => {
      if (status !== Confirmation.Status.confirm) {
        return;
      }

      this.messageShortcutService
        .delete(id)
        .subscribe(
          this.handleServiceResponse(
            '::MessageShortcut:ShortcutDeleted',
            '::MessageShortcut:ShortcutDeleteError',
          ),
        );
    });
  }

  changeSort(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
    this.loadMessageShortcuts();
  }

  changePage(event: PageEvent) {
    this.list.page = event.pageIndex;
    this.loadMessageShortcuts();
  }

  private loadMessageShortcuts() {
    this.list
      .hookToQuery(query =>
        this.messageShortcutService.getFilteredList({
          ...query,
          filter: this.filter,
        }),
      )
      .pipe(take(1))
      .subscribe(response => {
        this.messageShortcut = response;
      });
  }
}
