import {
  Component,
  computed,
  OnDestroy,
  OnInit,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { ListService, PagedResultDto } from '@abp/ng.core';
import { MessageDto, MessageService } from '@proxy/messages';
import { FormBuilder, FormGroup } from '@angular/forms';
import {
  catchError,
  distinctUntilChanged,
  merge,
  Observable,
  of,
  Subject,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs';
import { ToasterService } from '@abp/ng.theme.shared';
import { PageEvent } from '@angular/material/paginator';
import { debounceTime, finalize } from 'rxjs/operators';
import { DEBOUNCE_TIME } from '../../../../shared/constants';
import { wireServiceOptions } from '@proxy/common/wire-service.enum';

@Component({
  selector: 'app-inbox-tab',
  standalone: false,
  templateUrl: './inbox-tab.component.html',
  styleUrl: './inbox-tab.component.scss',
})
export class InboxTabComponent implements OnInit, OnDestroy {
  inboxMessages = { totalCount: 0, items: [] } as PagedResultDto<MessageDto>;
  isLoading: WritableSignal<boolean> = signal(false);
  searchForm: FormGroup;
  selectedMessageIds: WritableSignal<Set<string>> = signal(new Set<string>());
  isAllSelected: Signal<boolean> = computed(() => {
    const length = this.inboxMessages.items.length;
    const selectedLength = this.selectedMessageIds().size;
    return length > 0 && length === selectedLength;
  });
  readonly wireServiceOptions = wireServiceOptions;
  private refresh$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(
    readonly list: ListService,
    private readonly messageService: MessageService,
    private readonly toaster: ToasterService,
    private readonly fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.setupDataLoading();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPageChange(event: PageEvent): void {
    this.list.page = event.pageIndex;
    this.list.maxResultCount = event.pageSize;
    this.refresh$.next();
  }

  isFullySent(message: MessageDto): boolean {
    return message.messageDeliveries?.every(d => d.isSent) || false;
  }

  getRecipientNames(message: MessageDto): string {
    return (
      message.messageDeliveries
        ?.map(d => `${d.shop?.shopCode} - ${d.shop?.name}` || 'Unknown')
        .join(', ') || ''
    );
  }

  deleteSelectedMessages(): void {
    const selectedIds = Array.from(this.selectedMessageIds());

    if (selectedIds.length === 0) {
      this.toaster.error('No messages selected for deletion.');
      return;
    }

    this.messageService
      .deleteMessages(selectedIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.refresh$.next();
        this.selectedMessageIds.set(new Set<string>());
        this.toaster.success('Messages deleted successfully.');
      });
  }

  refreshMessages() {
    this.refresh$.next();
  }

  hasSelectedMessages(): boolean {
    return this.selectedMessageIds().size > 0;
  }

  toggleSelectAll(): void {
    const currentSet = new Set<string>(this.selectedMessageIds());
    if (this.isAllSelected()) {
      currentSet.clear();
    } else {
      this.inboxMessages.items.forEach(msg => currentSet.add(msg.id));
    }
    this.selectedMessageIds.set(currentSet);
  }

  toggleMessageSelection(id: string): void {
    const currentSet = new Set<string>(this.selectedMessageIds());
    if (currentSet.has(id)) {
      currentSet.delete(id);
    } else {
      currentSet.add(id);
    }
    this.selectedMessageIds.set(currentSet);
  }

  onCheckboxChange(id: string, checked: boolean): void {
    const currentSet = new Set<string>(this.selectedMessageIds());
    if (checked) {
      currentSet.add(id);
    } else {
      currentSet.delete(id);
    }
    this.selectedMessageIds.set(currentSet);
  }

  private buildForm(): void {
    this.searchForm = this.fb.group({
      filter: [''],
      wireServiceId: [0],
    });
  }

  private setupDataLoading(): void {
    merge(
      of(null),
      this.searchForm.valueChanges.pipe(
        debounceTime(DEBOUNCE_TIME),
        distinctUntilChanged(
          (prev, curr) => prev.filter === curr.filter && prev.wireServiceId === curr.wireServiceId,
        ),
      ),
      this.refresh$,
    )
      .pipe(
        tap(() => this.isLoading.set(true)),
        switchMap(() => this.loadInboxMessages()),
        takeUntil(this.destroy$),
      )
      .subscribe();
  }

  private loadInboxMessages(): Observable<PagedResultDto<MessageDto>> {
    return this.list
      .hookToQuery(query =>
        this.messageService.getReceivedMessagesForCurrentStore({
          ...query,
          ...this.searchForm.value,
        }),
      )
      .pipe(
        take(1),
        tap(response => {
          this.inboxMessages = response;
        }),
        catchError(error => {
          throw error;
        }),
        finalize(() => this.isLoading.set(false)),
      );
  }
}
