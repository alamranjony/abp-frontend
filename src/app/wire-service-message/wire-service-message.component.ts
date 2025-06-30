import { Component, OnDestroy, OnInit } from '@angular/core';
import { ListService, PagedResultDto } from '@abp/ng.core';
import {
  CreateUpdateWireServiceMessageDto,
  WireServiceMessageDto,
  WireServiceMessageService,
} from '@proxy/wire-services/wire-service-messages';
import { Subject, take, takeUntil } from 'rxjs';
import { Sort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { WireServiceMessageDialogComponent } from './wire-service-message-dialog/wire-service-message-dialog.component';
import {
  DIALOG_ENTER_ANIMATION_DURATION,
  DIALOG_EXIT_ANIMATION_DURATION,
} from '../shared/dialog.constants';
import { Confirmation, ConfirmationService, ToasterService } from '@abp/ng.theme.shared';
import { FormBuilder, FormGroup } from '@angular/forms';
import { wireServiceOptions } from '@proxy/common';

@Component({
  selector: 'app-wire-service-message',
  templateUrl: './wire-service-message.component.html',
  styleUrl: './wire-service-message.component.scss',
})
export class WireServiceMessageComponent implements OnInit, OnDestroy {
  wireServiceMessages = { items: [], totalCount: 0 } as PagedResultDto<WireServiceMessageDto>;
  columns: string[] = [
    'wireService',
    'messageType',
    'fromDate',
    'toDate',
    'amount',
    'message',
    'actions',
  ];
  searchForm: FormGroup;
  private destroy$: Subject<void> = new Subject();
  public wireServiceOptions = wireServiceOptions;

  constructor(
    public readonly list: ListService,
    private readonly wireServiceMessageService: WireServiceMessageService,
    private readonly dialog: MatDialog,
    private readonly toaster: ToasterService,
    private readonly confirmation: ConfirmationService,
    private readonly fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.buildForm();

    this.searchForm.valueChanges.subscribe(() => {
      this.list.page = 0;
      this.loadWireServiceMessages();
    });

    this.loadWireServiceMessages();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  changeSort(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
    this.loadWireServiceMessages();
  }

  changePage(event: PageEvent) {
    this.list.page = event.pageIndex;
    this.loadWireServiceMessages();
  }

  addWireServiceMessage() {
    this.dialog
      .open(WireServiceMessageDialogComponent, {
        width: '60%',
        enterAnimationDuration: DIALOG_ENTER_ANIMATION_DURATION,
        exitAnimationDuration: DIALOG_EXIT_ANIMATION_DURATION,
      })
      .afterClosed()
      .subscribe((result: CreateUpdateWireServiceMessageDto) => {
        if (result) {
          this.wireServiceMessageService.create(result).subscribe({
            next: () => {
              this.loadWireServiceMessages(() => {
                this.toaster.success('::WireServiceMessage:AddedSuccessfully');
              });
            },
            error: () => {
              this.toaster.error('::WireServiceMessage:SomethingWentWrong');
            },
          });
        }
      });
  }

  editWireServiceMessage(id: string) {
    this.wireServiceMessageService.get(id).subscribe(response => {
      this.dialog
        .open(WireServiceMessageDialogComponent, {
          width: '60%',
          data: response,
          enterAnimationDuration: DIALOG_ENTER_ANIMATION_DURATION,
          exitAnimationDuration: DIALOG_EXIT_ANIMATION_DURATION,
        })
        .afterClosed()
        .subscribe((result: CreateUpdateWireServiceMessageDto) => {
          if (!result) {
            return;
          }
          this.wireServiceMessageService.update(id, result).subscribe({
            next: () => {
              this.loadWireServiceMessages(() => {
                this.toaster.success('::WireServiceMessage:UpdatedSuccessfully');
              });
            },
            error: () => {
              this.toaster.error('::WireServiceMessage:SomethingWentWrong');
            },
          });
        });
    });
  }

  delete(id: string) {
    this.confirmation.warn('::AreYouSureToDelete', '::AreYouSure').subscribe(status => {
      if (status === Confirmation.Status.confirm) {
        this.wireServiceMessageService.delete(id).subscribe({
          next: () => {
            this.loadWireServiceMessages(() => {
              this.toaster.success('::WireServiceMessage:DeletedSuccessfully');
            });
          },
          error: () => {},
        });
      }
    });
  }

  clearFromDate() {
    this.searchForm.get('fromDate').setValue(null);
  }

  clearToDate() {
    this.searchForm.get('toDate').setValue(null);
  }

  private buildForm() {
    this.searchForm = this.fb.group({
      wireServiceId: [0],
      fromDate: [null],
      toDate: [null],
    });
  }

  private loadWireServiceMessages(callback?: Function): void {
    const { wireServiceId, fromDate, toDate } = this.searchForm.value;

    this.list
      .hookToQuery(query =>
        this.wireServiceMessageService.getList({
          ...query,
          wireServiceId: wireServiceId,
          fromDate: fromDate?.toLocaleDateString(),
          toDate: toDate?.toLocaleDateString(),
        }),
      )
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe(response => {
        this.wireServiceMessages = response;
        if (callback) {
          callback();
        }
      });
  }
}
