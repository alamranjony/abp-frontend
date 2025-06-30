import { Component, OnInit } from '@angular/core';
import { ListService, PagedResultDto } from '@abp/ng.core';
import {
  ValueDto,
  ValuePagedAndSortedResultRequestDto,
  ValueService,
  ValueTypeLookupDto,
  ValueTypeService,
} from '@proxy/values';
import { Observable } from 'rxjs';
import { Confirmation, ConfirmationService, ToasterService } from '@abp/ng.theme.shared';
import { map } from 'rxjs/operators';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ValueCreateEditDialogComponent } from '../value-create-edit-dialog/value-create-edit-dialog.component';
import {
  DIALOG_ENTER_ANIMATION_DURATION,
  DIALOG_EXIT_ANIMATION_DURATION,
} from 'src/app/shared/dialog.constants';

@Component({
  selector: 'app-value-type-details-list',
  templateUrl: './value-type-details-list.component.html',
  styleUrl: './value-type-details-list.component.scss',
  providers: [ListService],
})
export class ValueTypeDetailsListComponent implements OnInit {
  values = { items: [], totalCount: 0 } as PagedResultDto<ValueDto>;
  valueSearchParams = {} as ValuePagedAndSortedResultRequestDto;
  columns: string[] = [
    'name',
    'displayOrder',
    'valueType',
    'description',
    'isPreSelect',
    'actions',
  ];
  title: string;
  pValueTypes$: Observable<ValueTypeLookupDto[]>;
  constructor(
    public readonly list: ListService,
    private valueTypeService: ValueTypeService,
    private valueService: ValueService,
    private route: ActivatedRoute,
    private router: Router,
    private confirmation: ConfirmationService,
    private dialog: MatDialog,
    private toaster: ToasterService,
  ) {
    this.pValueTypes$ = valueTypeService.getValueTypeLookup().pipe(map(r => r.items));
  }

  ngOnInit(): void {
    this.valueSearchParams.valueTypeId = this.route.snapshot.paramMap.get('id');
    const valueStreamCreator = query =>
      this.valueService.getList({ ...query, valueTypeId: this.valueSearchParams.valueTypeId });

    this.list.hookToQuery(valueStreamCreator).subscribe(response => {
      this.title = response.items[0]?.valueType;
      this.values = response;
    });
  }

  createValue() {
    const dialogRef = this.dialog.open(ValueCreateEditDialogComponent, {
      width: '40%',
      data: {
        isEditMode: false,
        valueTypes: this.pValueTypes$,
        valueTypeId: this.valueSearchParams.valueTypeId,
      },
      enterAnimationDuration: DIALOG_ENTER_ANIMATION_DURATION,
      exitAnimationDuration: DIALOG_EXIT_ANIMATION_DURATION,
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.valueService.create(result).subscribe({
          next: () => {
            this.list.get();
            this.toaster.success('::Value:SuccessfullyAdded');
          },
          error: () => {
            this.toaster.error('::Value:ErrorSaving');
          },
        });
      }
    });
  }

  editValue(id: string) {
    this.valueService.get(id).subscribe(response => {
      const dialogRef = this.dialog.open(ValueCreateEditDialogComponent, {
        width: '40%',
        data: { ...response, isEditMode: true, valueTypes: this.pValueTypes$ },
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.valueService.update(id, result).subscribe({
            next: () => {
              this.list.get();
              this.toaster.success('::Value:SuccessfullyUpdated');
            },
            error: () => {
              this.toaster.error('::Value:ErrorSaving');
            },
          });
        }
      });
    });
  }

  delete(id: string) {
    this.confirmation.warn('::AreYouSureToDelete', '::AreYouSure').subscribe(status => {
      if (status === Confirmation.Status.confirm) {
        this.valueService.delete(id).subscribe(() => this.list.get());
      }
    });
  }

  changePage(pageEvent: PageEvent) {
    this.list.page = pageEvent.pageIndex;
  }

  changeSort(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
  }

  onBack(): void {
    this.router.navigate(['valuetypes']);
  }
}
