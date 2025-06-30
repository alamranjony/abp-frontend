import { Component, OnInit, ViewChild } from '@angular/core';
import { ListService, PagedResultDto } from '@abp/ng.core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { ValueTypeDto, ValueTypeLookupDto, ValueTypeService } from '@proxy/values';
import { Confirmation, ConfirmationService, ToasterService } from '@abp/ng.theme.shared';
import { MatDialog } from '@angular/material/dialog';
import { ValueTypeCreateEditDialogComponent } from '../value-type-create-edit-dialog/value-type-create-edit-dialog.component';
import {
  DIALOG_ENTER_ANIMATION_DURATION,
  DIALOG_EXIT_ANIMATION_DURATION,
} from 'src/app/shared/dialog.constants';

@Component({
  selector: 'app-value-type-list',
  templateUrl: './value-type-list.component.html',
  styleUrl: './value-type-list.component.scss',
  providers: [ListService],
})
export class ValueTypeListComponent implements OnInit {
  valueTypes = { items: [], totalCount: 0 } as PagedResultDto<ValueTypeDto>;
  columns: string[] = ['name', 'active', 'actions'];
  valueTypeLookups: ValueTypeLookupDto[] = [];
  valueTypeId: string | undefined = '';
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    public readonly list: ListService,
    private valueTypeService: ValueTypeService,
    private confirmation: ConfirmationService,
    private dialog: MatDialog,
    private toaster: ToasterService,
  ) {}

  ngOnInit(): void {
    const valueTypeStreamCreator = query =>
      this.valueTypeService.getList({
        ...query,
        valueTypeId: this.valueTypeId,
      });

    this.list.hookToQuery(valueTypeStreamCreator).subscribe(response => {
      this.valueTypes = response;
    });

    this.getValueTypesLookup();
  }

  createValueType() {
    const dialogRef = this.dialog.open(ValueTypeCreateEditDialogComponent, {
      width: '40%',
      data: { isEditMode: false },
      enterAnimationDuration: DIALOG_ENTER_ANIMATION_DURATION,
      exitAnimationDuration: DIALOG_EXIT_ANIMATION_DURATION,
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.valueTypeService.create(result).subscribe({
          next: () => {
            this.list.get();
            this.getValueTypesLookup();
            this.toaster.success('::ValueTypes:SuccessfullyAdded');
          },
          error: () => {
            this.toaster.error('::ValueTypes:ErrorSaving');
          },
        });
      }
    });
  }

  editValueType(id: string) {
    this.valueTypeService.get(id).subscribe(response => {
      const dialogRef = this.dialog.open(ValueTypeCreateEditDialogComponent, {
        width: '40%',
        data: { ...response, isEditMode: true },
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.valueTypeService.update(id, result).subscribe({
            next: () => {
              this.list.get();
              this.getValueTypesLookup();
              this.toaster.success('::ValueTypes:SuccessfullyUpdated');
            },
            error: () => {
              this.toaster.error('::ValueTypes:ErrorSaving');
            },
          });
        }
      });
    });
  }

  delete(id: string) {
    this.confirmation.warn('::AreYouSureToDelete', '::AreYouSure').subscribe(status => {
      if (status === Confirmation.Status.confirm) {
        this.valueTypeService.delete(id).subscribe(() => {
          this.list.get();
          this.getValueTypesLookup();
        });
      }
    });
  }

  changePage(pageEvent: PageEvent) {
    this.list.page = pageEvent.pageIndex;
  }

  changeSort(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
    this.list.page = 0;
    this.paginator.pageIndex = 0;
  }

  onValueTypeChange() {
    this.list.page = 0;
    this.list.get();
    this.paginator.pageIndex = 0;
  }

  getValueTypesLookup() {
    this.valueTypeService.getValueTypeLookup().subscribe(res => {
      this.valueTypeLookups = res.items;
    });
  }
}
