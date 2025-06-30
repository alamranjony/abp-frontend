import { Component, OnDestroy, OnInit } from '@angular/core';
import { ListService } from '@abp/ng.core';
import { LockedOrderDto, OrderService } from '@proxy/orders';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { ConfirmationService, ToasterService } from '@abp/ng.theme.shared';
import { Subject, take, takeUntil } from 'rxjs';
import { Sort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-locked-order-list',
  templateUrl: './locked-order-list.component.html',
  styleUrl: './locked-order-list.component.scss',
})
export class LockedOrderListComponent implements OnInit, OnDestroy {
  columns: string[] = ['select', 'orderNumber', 'storeName', 'assignedUserName', 'assignedTime'];
  dataSource = new MatTableDataSource<LockedOrderDto>();
  selection = new SelectionModel<LockedOrderDto>(true, []);
  private destroy$: Subject<void> = new Subject<void>();

  constructor(
    public readonly list: ListService,
    private readonly orderService: OrderService,
    private readonly confirmation: ConfirmationService,
    private readonly toaster: ToasterService,
  ) {}

  ngOnInit(): void {
    this.loadLockedOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isAllSelected() {
    const selectionCount = this.selection.selected.length;
    const rowCount = this.dataSource.data.length;
    return selectionCount === rowCount;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.dataSource.data);
  }

  changeSort(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
    this.loadLockedOrders();
  }

  changePage(event: PageEvent) {
    this.list.page = event.pageIndex;
    this.loadLockedOrders();
  }

  unlockOrders() {
    this.confirmation
      .show('::LockedOrder:UnlockMessage', '::AreYouSure', 'warning')
      .subscribe(status => {
        if (status === 'confirm') {
          const orderIds = this.selection.selected.map(e => e.id);
          this.orderService
            .unassignUserFromOrders(orderIds)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.loadLockedOrders(() => {
                  this.selection.clear();
                  this.toaster.success('::LockedOrder:OrderUnlocked');
                });
              },
              error: error => {
                this.toaster.error(error);
              },
            });
        }
      });
  }

  private loadLockedOrders(callback?: () => void): void {
    this.list
      .hookToQuery(query => this.orderService.getLockedOrders(query))
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe(response => {
        this.dataSource.data = response.items;
        if (callback) {
          callback();
        }
      });
  }
}
