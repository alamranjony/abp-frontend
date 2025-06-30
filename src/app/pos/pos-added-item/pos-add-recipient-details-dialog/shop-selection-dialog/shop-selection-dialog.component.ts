import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ShopLookupDto, ShopService } from '@proxy/shops';
import { SharedModule } from '../../../../shared/shared.module';
import { MatList, MatListItem } from '@angular/material/list';
import { WireService } from '@proxy/common';
import { Subject, take, takeUntil } from 'rxjs';
import { ListService, PagedResultDto } from '@abp/ng.core';
import { Sort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-shop-selection-dialog',
  standalone: true,
  imports: [SharedModule, MatList, MatListItem],
  templateUrl: './shop-selection-dialog.component.html',
  styleUrl: './shop-selection-dialog.component.scss',
  providers: [ListService],
})
export class ShopSelectionDialogComponent implements OnInit, OnDestroy {
  shops = { items: [], totalCount: 0 } as PagedResultDto<ShopLookupDto>;
  filter: string;
  wireService: WireService;
  isLoading: boolean = true;
  private destroy$: Subject<void> = new Subject<void>();

  constructor(
    public readonly list: ListService,
    private dialogRef: MatDialogRef<ShopSelectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { wireService: WireService },
    private readonly shopService: ShopService,
  ) {}

  ngOnInit(): void {
    this.wireService = this.data.wireService;
    this.loadWireServiceShops();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectShop(shop: ShopLookupDto) {
    this.dialogRef.close(shop);
  }

  close() {
    this.dialogRef.close();
  }

  onSearch(filter: string) {
    this.filter = filter;
    this.list.page = 0;
    this.loadWireServiceShops();
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
    this.isLoading = true;
    this.list
      .hookToQuery(query =>
        this.shopService.getShopsByWireService({
          ...query,
          filter: this.filter,
          wireServiceId: this.wireService,
        }),
      )
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe(shops => {
        this.shops = shops;
        this.isLoading = false;
      });
  }
}
