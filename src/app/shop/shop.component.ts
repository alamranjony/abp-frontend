import { ListService, PagedResultDto } from '@abp/ng.core';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ShopService, ShopDto } from '@proxy/shops';
import { ConfirmationService, Confirmation, ToasterService } from '@abp/ng.theme.shared';
import { Sort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';
import { wireServiceOptions } from '@proxy/common';
import { Subject, take, takeUntil } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ShopLiveSyncComponent } from './shop-live-sync/shop-live-sync.component';
import { DIALOG_ENTER_ANIMATION_DURATION } from '../shared/dialog.constants';

@Component({
  selector: 'app-shop',
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss'],
  providers: [ListService],
})
export class ShopComponent implements OnInit, OnDestroy {
  shops = { items: [], totalCount: 0 } as PagedResultDto<ShopDto>;
  filter: string = '';
  columns = [
    'name',
    'shopCode',
    'zipCode',
    'email',
    'phone',
    'isFFC',
    'openSunday',
    'orderSent',
    'orderReceived',
    'orderRejected',
    'wireServiceId',
    'actions',
  ];
  wireService = wireServiceOptions;
  wireServiceId: number = 0;
  destroy$: Subject<void> = new Subject();
  isBloomNetSyncing = false;
  isFTDSyncing = false;
  isTelefloraSyncing = false;
  isTenant = false;

  constructor(
    public readonly list: ListService<ShopDto>,
    private readonly shopService: ShopService,
    private readonly toasterService: ToasterService,
    private confirmation: ConfirmationService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.loadShops();
  }

  delete(id: string) {
    this.confirmation.warn('::AreYouSureToDelete', '::AreYouSure').subscribe(status => {
      if (status === Confirmation.Status.confirm) {
        this.shopService.delete(id).subscribe(() => this.loadShops());
      }
    });
  }

  search(filter: string) {
    this.filter = filter;
    this.list.page = 0;
    this.loadShops();
  }

  filterByWireService(event: any) {
    if (event) {
      this.wireServiceId = event.value;
      this.list.page = 0;
      this.loadShops();
    }
  }

  changeSort(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
    this.loadShops();
  }

  changePage(event: PageEvent) {
    this.list.page = event.pageIndex;
    this.loadShops();
  }

  private loadShops() {
    const shopStreamCreator = query =>
      this.shopService.getList({
        ...query,
        filter: this.filter,
        wireServiceId: this.wireServiceId,
      });
    this.list
      .hookToQuery(shopStreamCreator)
      .pipe(take(1))
      .subscribe(response => {
        this.shops = response;

        const hasShops = this.shops?.items?.length > 0;
        const firstShopTenantId = this.shops?.items?.[0]?.tenantId;
        this.isTenant = !hasShops || firstShopTenantId != null;
      });
  }

  openLiveSyncDialogue = () => {
    this.dialog.open(ShopLiveSyncComponent, {
      width: 'auto',
      height: 'auto',
      enterAnimationDuration: DIALOG_ENTER_ANIMATION_DURATION,
    });
    this.dialog.afterAllClosed.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadShops();
    });
  };

  runMasDirectSync() {
    this.shopService
      .shopSyncForMasDirect()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toasterService.success('::Shop:LiveSyncSuccess');
          this.loadShops();
        },
        error: () => {
          this.toasterService.error('::Shop:LiveSyncError');
        },
      });
  }

  runFSNSync() {
    this.shopService
      .shopSyncForFSN()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toasterService.success('::Shop:LiveSyncSuccess');
          this.loadShops();
        },
        error: () => {
          this.toasterService.error('::Shop:LiveSyncError');
        },
      });
  }

  runBloomNetSync() {
    this.isBloomNetSyncing = true;
    this.shopService
      .shopSyncForBloomNet()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toasterService.success('::Shop:LiveSyncSuccess');
          this.loadShops();
          this.isBloomNetSyncing = false;
        },
        error: () => {
          this.toasterService.error('::Shop:LiveSyncError');
          this.isBloomNetSyncing = false;
        },
      });
  }

  onFTDFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.runFTDSync(file);
    input.value = '';
  }

  onTelefloraFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.runTelefloraSync(file);
    input.value = '';
  }

  runFTDSync(file: File) {
    this.isFTDSyncing = true;
    const myFormData = new FormData();
    myFormData.append('file', file);
    this.shopService
      .shopSyncForFTD(myFormData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toasterService.success('::Shop:LiveSyncSuccess');
          this.loadShops();
          this.isFTDSyncing = false;
        },
        error: () => {
          this.toasterService.error('::Shop:LiveSyncError');
          this.isFTDSyncing = false;
        },
      });
  }

  runTelefloraSync(file: File) {
    this.isTelefloraSyncing = true;
    const myFormData = new FormData();
    myFormData.append('file', file);
    this.shopService
      .shopSyncForTeleflora(myFormData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toasterService.success('::Shop:LiveSyncSuccess');
          this.loadShops();
          this.isTelefloraSyncing = false;
        },
        error: () => {
          this.toasterService.error('::Shop:LiveSyncError');
          this.isTelefloraSyncing = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
