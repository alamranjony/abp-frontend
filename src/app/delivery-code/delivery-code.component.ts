import { ListService, PagedResultDto } from '@abp/ng.core';
import { Confirmation, ConfirmationService, ToasterService } from '@abp/ng.theme.shared';
import { Component, OnInit } from '@angular/core';
import { DeliveryCodeDto, DeliveryCodeService, StatusCategory } from '@proxy/deliveries';
import { MatDialog } from '@angular/material/dialog';
import { DeliveryCodeDialogComponent } from './delivery-code-dialog/delivery-code-dialog.component';
import { Sort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';
import {
  DIALOG_ENTER_ANIMATION_DURATION,
  DIALOG_EXIT_ANIMATION_DURATION,
} from '../shared/dialog.constants';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged, take } from 'rxjs';
import { DEBOUNCE_TIME } from '../shared/constants';

@Component({
  selector: 'app-delivery-code',
  templateUrl: './delivery-code.component.html',
  styleUrl: './delivery-code.component.scss',
  providers: [ListService],
})
export class DeliveryCodeComponent implements OnInit {
  deliveryCodes: PagedResultDto<DeliveryCodeDto> = { items: [], totalCount: 0 };
  columns: string[] = ['code', 'statusCategory', 'actions'];
  statusCategories: { value: number; text: string }[];
  filterForm: FormGroup;

  constructor(
    public readonly list: ListService,
    private deliveryCodeService: DeliveryCodeService,
    private confirmation: ConfirmationService,
    private dialog: MatDialog,
    private toasterService: ToasterService,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.statusCategories = Object.keys(StatusCategory)
      .filter(key => isNaN(Number(key)))
      .map(key => ({
        text: `::Enum:${key}`,
        value: StatusCategory[key] as number,
      }));

    this.filterForm = this.fb.group({
      code: [null],
      statusCategory: [0],
    });

    this.filterForm.valueChanges
      .pipe(debounceTime(DEBOUNCE_TIME), distinctUntilChanged())
      .subscribe(() => {
        this.list.page = 0;
        this.loadDeliveryCodes();
      });

    this.loadDeliveryCodes();
  }

  delete(id: string) {
    this.confirmation.warn('::AreYouSureToDelete', '::AreYouSure').subscribe(status => {
      if (status === Confirmation.Status.confirm) {
        this.deliveryCodeService.delete(id).subscribe(() => this.loadDeliveryCodes());
      }
    });
  }

  addDeliveryCode() {
    const dialogRef = this.dialog.open(DeliveryCodeDialogComponent, {
      width: '50%',
      data: { isEditMode: false },
      enterAnimationDuration: DIALOG_ENTER_ANIMATION_DURATION,
      exitAnimationDuration: DIALOG_EXIT_ANIMATION_DURATION,
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deliveryCodeService.create(result).subscribe({
          next: () => {
            this.loadDeliveryCodes();
            this.toasterService.success('Added Successfully');
          },
          error: () => {
            this.toasterService.error('An error occurred. Please try again.');
          },
        });
      }
    });
  }

  editDeliveryCode(id: string) {
    this.deliveryCodeService.get(id).subscribe(response => {
      const dialogRef = this.dialog.open(DeliveryCodeDialogComponent, {
        width: '50%',
        data: { ...response, isEditMode: true },
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.deliveryCodeService.update(id, result).subscribe({
            next: () => {
              this.loadDeliveryCodes();
              this.toasterService.success('Updated Successfully');
            },
            error: () => {
              this.toasterService.error('An error occurred. Please try again.');
            },
          });
        }
      });
    });
  }

  changeSort(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
    this.loadDeliveryCodes();
  }

  changePage(event: PageEvent) {
    this.list.page = event.pageIndex;
    this.loadDeliveryCodes();
  }

  private loadDeliveryCodes() {
    const code = this.filterForm.get('code').value;
    const statusCategoryId = this.filterForm.get('statusCategory').value;

    this.list
      .hookToQuery(query =>
        this.deliveryCodeService.getList({
          ...query,
          code: code?.trim(),
          statusCategoryId: statusCategoryId,
        }),
      )
      .pipe(take(1))
      .subscribe(response => {
        this.deliveryCodes = response;
      });
  }

  clearSearch() {
    this.filterForm.get('code').setValue(null);
  }
}
