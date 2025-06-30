import { ListService, PagedResultDto } from '@abp/ng.core';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { CreateUpdateTermsCodeComponent } from './create-update-terms-code/create-update-terms-code.component';
import { map, Subject, take, takeUntil } from 'rxjs';
import { TermsCodeService } from '@proxy/terms-codes';

@Component({
  selector: 'app-terms-code',
  templateUrl: './terms-code.component.html',
  styleUrls: ['./terms-code.component.scss'],
  providers: [ListService],
})
export class TermsCodeComponent implements OnInit, OnDestroy {
  termsCodePaginatedResult = { items: [], totalCount: 0 } as PagedResultDto<any>;
  destroy$ = new Subject<void>();
  constructor(
    public readonly list: ListService,
    private dialog: MatDialog,
    private termsCodeService: TermsCodeService,
  ) {}

  ngOnInit() {
    this.loadAllTermsCodes();
  }

  columns: string[] = [
    'code',
    'netDueDays',
    'agingBucket',
    'lateChargePercentage',
    'minimumLateChargeAmount',
    'actions',
  ];
  filter: string = '';

  addTermsCode() {
    let dialogRef = this.dialog.open(CreateUpdateTermsCodeComponent, {
      width: '40%',
      data: { isEditMode: false },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(_ => {
        this.loadAllTermsCodes();
      });
  }

  changeSort(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
    this.loadAllTermsCodes();
  }

  changePage(event: PageEvent) {
    this.list.page = event.pageIndex;
    this.loadAllTermsCodes();
  }

  search(filter: string) {
    this.filter = filter;
    this.list.page = 0;
    this.loadAllTermsCodes();
  }

  private loadAllTermsCodes() {
    this.list
      .hookToQuery(query =>
        this.termsCodeService.getList({
          ...query,
          filter: this.filter,
        }),
      )
      .pipe(
        take(1),
        takeUntil(this.destroy$),
        map(response => {
          return {
            ...response,
            items: response.items.map(termsCode => {
              termsCode.agingBucket = termsCode.agingBucket * 30;
              return termsCode;
            }),
          };
        }),
      )
      .subscribe(result => {
        this.termsCodePaginatedResult = result;
      });
  }

  editTermsCodeById(id: string) {
    let dialogRef = this.dialog.open(CreateUpdateTermsCodeComponent, {
      width: '40%',
      data: { isEditMode: true, termsCodeId: id },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(_ => {
        this.loadAllTermsCodes();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }
}
