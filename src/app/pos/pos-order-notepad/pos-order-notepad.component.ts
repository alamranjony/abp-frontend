import { ListService, PagedResultDto } from '@abp/ng.core';
import { ToasterService } from '@abp/ng.theme.shared';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import {
  OrderNoteDto,
  OrderNoteService,
  OrderNoteType,
  orderNoteTypeOptions,
} from '@proxy/order-notes';
import { take } from 'rxjs';
import { SharedModule } from 'src/app/shared/shared.module';
import { SharedDataService } from '../shared-data.service';
import { sortEnumValues } from 'src/app/shared/common-utils';

@Component({
  selector: 'app-pos-order-notepad',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './pos-order-notepad.component.html',
  styleUrl: './pos-order-notepad.component.scss',
  providers: [ListService],
})
export class PosOrderNotepadComponent implements OnInit {
  orderNoteType = sortEnumValues(orderNoteTypeOptions);
  orderNotes = { items: [], totalCount: 0 } as PagedResultDto<OrderNoteDto>;
  noteMessage: string;
  filterForm: FormGroup;
  orderNoteDto: OrderNoteDto = {
    note: undefined,
    orderNumber: undefined,
    orderNoteType: undefined,
  };
  orderNumber: number = 0;
  columns: string[] = ['orderNumber', 'creationTime', 'userName', 'note', 'orderNoteType'];

  constructor(
    private fb: FormBuilder,
    private orderNoteService: OrderNoteService,
    private toasterService: ToasterService,
    private sharedDataService: SharedDataService,
    readonly list: ListService,
  ) {}

  ngOnInit() {
    this.buildForm();
    this.sharedDataService.orderNumber$.subscribe((orderNumber: number) => {
      this.orderNumber = orderNumber;
    });

    this.loadOrderNotes();
  }

  private buildForm(): void {
    this.filterForm = this.fb.group({
      keyword: [''],
      noteType: ['all'],
    });
  }

  onSearch() {
    if (this.filterForm.valid) {
      this.list.page = 0;
      this.loadOrderNotes();
    }
  }

  changePage(pageEvent: PageEvent) {
    this.list.page = pageEvent.pageIndex;
    this.loadOrderNotes();
  }

  changeSort(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
    this.loadOrderNotes();
  }

  private loadOrderNotes() {
    this.list
      .hookToQuery(query =>
        this.orderNoteService.getList({
          ...query,
          keyWord: this.filterForm.value.keyword || undefined,
          orderNoteType:
            this.filterForm.value.noteType !== 'all' ? this.filterForm.value.noteType : undefined,
        }),
      )
      .pipe(take(1))
      .subscribe(response => {
        this.orderNotes = response;
      });
  }

  addNote(): void {
    if (this.orderNumber == 0) {
      this.toasterService.error('::Pos:NotepadOrderRequired');
      return;
    }

    if (!this.noteMessage?.trim()) {
      this.toasterService.error('::Pos:CustomNodeEmptyMessage');
      return;
    }

    this.orderNoteDto.note = this.noteMessage;
    this.orderNoteDto.orderNoteType = OrderNoteType.Custom;
    this.orderNoteDto.orderNumber = this.orderNumber;

    this.orderNoteService.create(this.orderNoteDto).subscribe({
      next: () => {
        this.toasterService.success('::Pos:CustomNodeAddSuccess');
        this.noteMessage = '';
      },
      error: () => {
        this.toasterService.error('::Pos:CustomNodeAddError');
      },
    });
  }
}
