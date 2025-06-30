import { ListService, PagedResultDto } from '@abp/ng.core';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  PhoneDirectoryService,
  PhoneDirectoryDto,
  CreateUpdatePhoneDirectoryDto,
  NumberType,
} from '@proxy/phone-directories';
import { ConfirmationService, Confirmation, ToasterService } from '@abp/ng.theme.shared';
import { PhoneDirectoryDialogComponent } from './phone-directory-dialog/phone-directory-dialog.component';
import { PageEvent } from '@angular/material/paginator';
import { DialogUtilService } from '../shared/dialog-util.service';

@Component({
  selector: 'app-phone-directory',
  templateUrl: './phone-directory.component.html',
  styleUrl: './phone-directory.component.scss',
  providers: [ListService],
})
export class PhoneDirectoryComponent implements OnInit {
  @Input() entityId?: string;
  @Input() entityName?: string;
  @Output() createdPhoneDirectoriesEvent = new EventEmitter<CreateUpdatePhoneDirectoryDto[]>();

  phoneDirectories = { items: [], totalCount: 0 } as PagedResultDto<PhoneDirectoryDto>;
  columns: string[] = ['phoneNumber', 'isPrimary', 'isAcceptTextMessage', 'actions'];

  constructor(
    public readonly list: ListService,
    private phoneDirectoryService: PhoneDirectoryService,
    private confirmation: ConfirmationService,
    private toasterService: ToasterService,
    private dialogUtil: DialogUtilService,
  ) {}

  ngOnInit() {
    if (!this.entityName) {
      this.columns.push('entityName');
    }
    this.loadCustomerPhoneDirectories();
  }

  private loadCustomerPhoneDirectories() {
    if (!this.entityId) return;

    const phoneDirectoryStreamCreator = query =>
      this.phoneDirectoryService.getFilteredList({
        ...query,
        entityId: this.entityId,
        entityName: this.entityName,
      });
    this.list.hookToQuery(phoneDirectoryStreamCreator).subscribe(response => {
      this.phoneDirectories = response;
    });
  }

  createPhone() {
    this.openPhoneDirectoryDialog(false);
  }

  private onCreatePhone(result: any) {
    if (!this.entityId) {
      result.id = crypto.randomUUID();
      this.updateLocalPhoneDirList([...this.phoneDirectories.items, result]);
      this.onSuccess('::CreateSuccess');
      return;
    }

    this.create(result);
  }

  private create(result: any) {
    this.phoneDirectoryService.create(result).subscribe({
      next: () => {
        this.onSuccess('::CreateSuccess');
        this.updateLocalPhoneDirList([...this.phoneDirectories.items, result]);
      },
      error: () => this.toasterService.error('::ErrorOccurred'),
    });
  }

  private openPhoneDirectoryDialog(
    isEditMode: boolean,
    data: PhoneDirectoryDto = {
      entityId: this.entityId,
      entityName: this.entityName,
      phoneNumber: '',
      isPrimary: false,
      isAcceptTextMessage: false,
      numberType: NumberType.Mobile,
    },
    id?: string,
  ) {
    const dialogRef = this.dialogUtil.openDialog(PhoneDirectoryDialogComponent, {
      ...data,
      isEditMode,
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        isEditMode ? this.onEditPhone(id!, result) : this.onCreatePhone(result);
      }
    });
  }

  editPhone(id: string) {
    if (!this.entityId) {
      const phoneDirectory = this.phoneDirectories.items.find(item => item.id === id);
      if (phoneDirectory) {
        this.openPhoneDirectoryDialog(true, phoneDirectory, id);
      }
      return;
    }

    this.phoneDirectoryService.get(id).subscribe(result => {
      this.openPhoneDirectoryDialog(true, result, id);
    });
  }

  private onEditPhone(id: string, result: any) {
    if (!this.entityId) {
      this.updateLocalPhoneDirList(
        this.phoneDirectories.items.map(item => (item.id === id ? result : item)),
      );
      this.onSuccess('::UpdateSuccess');
      return;
    }

    this.update(id, result);
  }

  private update(id: string, result: any) {
    this.phoneDirectoryService.update(id, result).subscribe({
      next: () => {
        this.onSuccess('::UpdateSuccess');
        this.updateLocalPhoneDirList(
          this.phoneDirectories.items.map(item => (item.id === id ? result : item)),
        );
      },
      error: () => this.toasterService.error('::ErrorOccurred'),
    });
  }

  onDelete(id: string) {
    this.confirmation.warn('::AreYouSureToDelete', '::AreYouSure').subscribe(status => {
      if (status === Confirmation.Status.confirm) {
        if (!this.entityId) {
          this.updateLocalPhoneDirList(this.phoneDirectories.items.filter(item => item.id !== id));
          this.onSuccess('::DeleteSuccess');
          return;
        }

        this.delete(id);
      }
    });
  }

  private delete(id: string) {
    this.phoneDirectoryService.delete(id).subscribe({
      next: () => {
        this.onSuccess('::DeleteSuccess');
        this.updateLocalPhoneDirList(this.phoneDirectories.items.filter(item => item.id !== id));
      },
      error: () => this.toasterService.error('::ErrorOccurred'),
    });
  }

  private onSuccess(message: string) {
    this.toasterService.success(message);

    if (!this.entityId) return;
    this.list.get();
  }

  private updateLocalPhoneDirList(items: PhoneDirectoryDto[]) {
    this.phoneDirectories = { ...this.phoneDirectories, items };
    this.createdPhoneDirectoriesEvent.emit(this.mapToPhoneDirectoryDtos(items));
  }

  private mapToPhoneDirectoryDtos(items: PhoneDirectoryDto[]): CreateUpdatePhoneDirectoryDto[] {
    return items.map(
      ({ entityId, phoneNumber, isPrimary, numberType, isAcceptTextMessage, entityName }) => ({
        entityId,
        phoneNumber,
        isPrimary,
        numberType,
        isAcceptTextMessage,
        entityName,
      }),
    );
  }

  changePage(event: PageEvent) {
    this.list.page = event.pageIndex;
  }
}
