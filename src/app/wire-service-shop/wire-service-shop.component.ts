import { ListService, PagedResultDto } from '@abp/ng.core';
import { Component, OnInit } from '@angular/core';
import { WireServiceShopService, WireServiceShopDto } from '@proxy/wire-service-shops';
import { FormGroup } from '@angular/forms';
import { ConfirmationService, Confirmation, ToasterService } from '@abp/ng.theme.shared';
import { wireServiceOptions } from '@proxy/common';
import { Sort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { WireShopDialogComponent } from './wire-shop-dialog/wire-shop-dialog.component';
import { take } from 'rxjs';
import { sortEnumValues } from '../shared/common-utils';

@Component({
  selector: 'app-wire-service-shop',
  templateUrl: './wire-service-shop.component.html',
  styleUrl: './wire-service-shop.component.scss',
  providers: [ListService],
})
export class WireServiceShopComponent implements OnInit {
  wireShop = { items: [], totalCount: 0 } as PagedResultDto<WireServiceShopDto>;
  wireServiceId = 0;
  isWireShopModalOpen = false;
  selectedWireServiceShop = {} as WireServiceShopDto;
  wireShopform: FormGroup;
  wireService = sortEnumValues(wireServiceOptions);
  columns = ['account', 'userId', 'wireServiceId', 'isDefault', 'actions'];

  constructor(
    public readonly list: ListService,
    private wireShopService: WireServiceShopService,
    private confirmation: ConfirmationService,
    private dialog: MatDialog,
    private toasterService: ToasterService,
  ) {}

  ngOnInit() {
    this.loadWireServiceShops();
  }

  createWireServiceShop() {
    const dialogRef = this.dialog.open(WireShopDialogComponent, {
      width: '50%',
      data: { isEditMode: false },
      enterAnimationDuration: 250,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.wireShopService.create(result).subscribe({
          next: () => {
            this.loadWireServiceShops();
            this.toasterService.success('::SuccessfullyAdded');
          },
          error: () => {
            this.toasterService.error('::ErrorOccured');
          },
        });
      }
    });
  }

  editWireServiceShop(id: string) {
    this.wireShopService.get(id).subscribe(response => {
      const dialogRef = this.dialog.open(WireShopDialogComponent, {
        width: '50%',
        data: { ...response, isEditMode: true },
        enterAnimationDuration: 250,
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.wireShopService.update(id, result).subscribe({
            next: () => {
              this.loadWireServiceShops();
              this.toasterService.success('::SuccessfullyUpdated');
            },
            error: () => {
              this.toasterService.error('::ErrorOccured');
            },
          });
        }
      });
    });
  }

  deleteWireServiceShop(id: string) {
    this.confirmation.warn('::AreYouSureToDelete', '::AreYouSure').subscribe(status => {
      if (status === Confirmation.Status.confirm) {
        this.wireShopService.delete(id).subscribe(() => this.loadWireServiceShops());
      }
    });
  }

  filterByWireService(event: any) {
    if (event) {
      if (!event.value) {
        return;
      }
      this.wireServiceId = event.value;
      this.loadWireServiceShops();
    }
  }

  changeSort(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
    this.loadWireServiceShops();
  }

  changePage(event: PageEvent) {
    this.list.page = event.pageIndex;
    this.loadWireServiceShops();
  }

  private loadWireServiceShops() {
    this.list
      .hookToQuery(query =>
        this.wireShopService.getList({ ...query, wireServiceId: this.wireServiceId }),
      )
      .pipe(take(1))
      .subscribe(response => {
        this.wireShop = response;
      });
  }
}
