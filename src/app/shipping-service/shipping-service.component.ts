import { ListService, PagedResultDto } from '@abp/ng.core';
import { Confirmation, ConfirmationService, ToasterService } from '@abp/ng.theme.shared';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { ShippingServiceDialogComponent } from './shipping-service-dialog/shipping-service-dialog.component';
import { ShippingServiceDto, ShippingServiceService } from '@proxy/deliveries';
import {
  DIALOG_ENTER_ANIMATION_DURATION,
  DIALOG_EXIT_ANIMATION_DURATION,
} from '../shared/dialog.constants';
import { take } from 'rxjs';

@Component({
  selector: 'app-shipping-service',
  templateUrl: './shipping-service.component.html',
  styleUrl: './shipping-service.component.scss',
  providers: [ListService],
})
export class ShippingServiceComponent implements OnInit {
  shippingServices = { items: [], totalCount: 0 } as PagedResultDto<ShippingServiceDto>;
  columns: string[] = ['name', 'status', 'actions'];
  filter: string = '';

  constructor(
    public readonly list: ListService,
    private readonly shippingService: ShippingServiceService,
    private readonly confirmation: ConfirmationService,
    private dialog: MatDialog,
    private toasterService: ToasterService,
  ) {}

  ngOnInit(): void {
    this.loadShippingServices();
  }

  addShippingService() {
    const dialogRef = this.dialog.open(ShippingServiceDialogComponent, {
      width: '40%',
      data: { isEditMode: false },
      enterAnimationDuration: DIALOG_ENTER_ANIMATION_DURATION,
      exitAnimationDuration: DIALOG_EXIT_ANIMATION_DURATION,
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.shippingService.create(result).subscribe({
          next: () => {
            this.onSuccess('::ShippingService:SuccessfullyAdded');
          },
          error: () => {
            this.onError('::ShippingService:ErrorSaving');
          },
        });
      }
    });
  }

  editShippingService(id: string) {
    this.shippingService.get(id).subscribe(response => {
      const dialogRef = this.dialog.open(ShippingServiceDialogComponent, {
        width: '40%',
        data: { ...response, isEditMode: true },
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.shippingService.update(id, result).subscribe({
            next: () => {
              this.onSuccess('::ShippingService:SuccessfullyUpdated');
            },
            error: () => {
              this.onError('::ShippingService:ErrorSaving');
            },
          });
        }
      });
    });
  }

  delete(id: string) {
    this.confirmation.warn('::AreYouSureToDelete', '::AreYouSure').subscribe(status => {
      if (status === Confirmation.Status.confirm) {
        this.shippingService.delete(id).subscribe({
          next: () => {
            this.onSuccess('::ShippingService:SuccessfullyDeleted');
          },
          error: () => {
            this.onError('::ShippingService:ErrorDeleting');
          },
        });
      }
    });
  }

  onSearch(filter: string) {
    this.filter = filter;
    this.list.page = 0;
    this.loadShippingServices();
  }

  changeSort(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
    this.loadShippingServices();
  }

  changePage(event: PageEvent) {
    this.list.page = event.pageIndex;
    this.loadShippingServices();
  }

  private loadShippingServices() {
    this.list
      .hookToQuery(query =>
        this.shippingService.getList({
          ...query,
          filter: this.filter,
        }),
      )
      .pipe(take(1))
      .subscribe(response => {
        this.shippingServices = response;
      });
  }

  private onSuccess(message: string) {
    this.filter = '';
    this.toasterService.success(message);
    this.loadShippingServices();
  }

  private onError(message: string) {
    this.toasterService.error(message);
  }
}
