import { ConfigStateService, CurrentUserDto, ListService, PagedResultDto } from '@abp/ng.core';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import {
  DeliveryCategory,
  deliveryCategoryOptions,
  FilterPagedAndSortedOrderControlListResultRequestDto,
  OrderService,
  OrderStatus,
  orderStatusOptions,
  OrderType,
  orderTypeOptions,
  SubOrderControlListDto,
  SubOrderDeliveryStatus,
  subOrderDeliveryStatusOptions,
} from '@proxy/orders';
import { Subject, take, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { ToasterService } from '@abp/ng.theme.shared';
import { StoreLookupDto, StoreService } from '@proxy/stores';
import { OrderActionType } from './models/order-action-type.enum';
import { Sort } from '@angular/material/sort';
import { sortEnumValues } from '../shared/common-utils';
import { ReportFilterDto } from '../models/report-filter-dto';
import { OrderMasterListReportService } from '../services/reports/order-master-list-report.service';
import { FilterDateCategory } from '@proxy/reports';
import { OrderControlCsvExportService } from '../services/order-control-csv-export.service';

@Component({
  selector: 'app-order-control-list',
  templateUrl: './order-control-list.component.html',
  styleUrls: ['./order-control-list.component.scss'],
  providers: [ListService],
})
export class OrderControlListComponent implements OnInit, OnDestroy {
  filterForm: FormGroup;
  orderControlList = { items: [], totalCount: 0 } as PagedResultDto<SubOrderControlListDto>;
  displayedColumns: string[] = [
    'subOrderNumber',
    'orderType',
    'salesRep',
    'customer',
    'recipient',
    'address',
    'product',
    'amount',
    'orderTotal',
    'deliveryDate',
    'orderStatus',
    'deliveryStatus',
    'deliveryCategory',
    'fulfillingStore',
    'originalStore',
    'actions',
  ];

  orderType = sortEnumValues(orderTypeOptions);
  orderStatus = sortEnumValues(orderStatusOptions);
  deliveryCategory = sortEnumValues(deliveryCategoryOptions);
  subOrderDeliveryStatus = sortEnumValues(subOrderDeliveryStatusOptions);
  enumValueForAllValueOrders = '0';
  fromDate: string;
  toDate: string;
  storeList: StoreLookupDto[];
  orderStatusEnum = OrderStatus;
  subOrderDeliveryStatusEnum = SubOrderDeliveryStatus;
  orderTypeEnum = OrderType;
  private currentUser: CurrentUserDto;
  private destroy$: Subject<void> = new Subject();

  constructor(
    private readonly orderService: OrderService,
    private fb: FormBuilder,
    private router: Router,
    private toasterService: ToasterService,
    private storeService: StoreService,
    readonly list: ListService,
    private configState: ConfigStateService,
    private orderMasterListReportService: OrderMasterListReportService,
    private orderControlCSVService: OrderControlCsvExportService,
  ) {
    this.currentUser = this.configState.getOne('currentUser') as CurrentUserDto;
  }

  ngOnInit() {
    this.buildForm();
    this.storeService.getStoreLookup().subscribe(store => {
      this.storeList = store.items;
      if (window.history.state?.isWillCall)
        this.filterForm.value.deliveryCategory = DeliveryCategory.WillCall;
      if (window.history.state?.isConfirmDelivery)
        this.filterForm.value.deliveryStatus = SubOrderDeliveryStatus.Delivered;
    });
    this.loadOrderList();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForm(): void {
    const today = new Date();
    const lastWeekDate = new Date();
    lastWeekDate.setDate(today.getDate() - 7);

    this.filterForm = this.fb.group({
      fromDate: [lastWeekDate],
      toDate: [today],
      orderType: [this.enumValueForAllValueOrders],
      orderStatus: [this.enumValueForAllValueOrders],
      deliveryCategory: [this.enumValueForAllValueOrders],
      deliveryStatus: [this.enumValueForAllValueOrders],
      store: [this.enumValueForAllValueOrders],
      keyword: [''],
    });
  }

  onSearch() {
    if (this.filterForm.valid) {
      const dateRange = this.getValidatedDateRange();
      if (!dateRange) return;
      this.fromDate = dateRange.fromDate;
      this.toDate = dateRange.toDate;

      this.list.page = 0;
      this.loadOrderList();
    }
  }

  changePage(pageEvent: PageEvent) {
    this.list.page = pageEvent.pageIndex;
    this.loadOrderList();
  }

  private loadOrderList() {
    this.list
      .hookToQuery(query =>
        this.orderService.getAllOrders({
          ...query,
          orderType:
            this.filterForm.value.orderType !== this.enumValueForAllValueOrders
              ? this.filterForm.value.orderType
              : undefined,
          orderStatus:
            this.filterForm.value.orderStatus !== this.enumValueForAllValueOrders
              ? this.filterForm.value.orderStatus
              : undefined,
          deliveryCategory:
            this.filterForm.value.deliveryCategory !== this.enumValueForAllValueOrders
              ? this.filterForm.value.deliveryCategory
              : undefined,
          fromDate: new Date(this.filterForm.value.fromDate).toDateString(),
          toDate: new Date(this.filterForm.value.toDate).toDateString(),
          deliveryStatus:
            this.filterForm.value.deliveryStatus !== this.enumValueForAllValueOrders
              ? this.filterForm.value.deliveryStatus
              : undefined,
          storeId:
            this.filterForm.value.store !== this.enumValueForAllValueOrders
              ? this.filterForm.value.store
              : undefined,
          keyword: this.filterForm.value.keyword?.trim(),
        }),
      )
      .pipe(take(1))
      .subscribe(response => {
        this.orderControlList = response;
      });
  }

  showDetails(orderId: string) {
    this.router.navigate(['order-control-list/order-details', orderId]);
  }

  openInOrderEntry(orderId: string) {
    const allowedOrderStatusesForOpeningInOrderEntry = [
      OrderStatus.Abandoned,
      OrderStatus.Hold,
      OrderStatus.Review,
      OrderStatus.InProgress,
    ];

    const order = this.orderControlList.items.find(x => x.orderId === orderId);
    if (order.assignedUserId && order.assignedUserId !== this.currentUser.id) {
      this.toasterService.error('::OrderControl:AssignedToOtherUser');
      return;
    }

    if (!allowedOrderStatusesForOpeningInOrderEntry.includes(order?.orderStatus)) {
      this.toasterService.error('::OrderControl:CannotOpenInOrderEntry');
      return;
    }

    this.orderService
      .assignUserToOrder(orderId, this.currentUser.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toasterService.warn('::OrderControl:UnassignedPreviousOrder');
          this.router.navigateByUrl('/pos', {
            state: { orderId: orderId, action: OrderActionType.OpenOrderInOrderEntry },
          });
        },
        error: () => {
          this.toasterService.error('::OrderControl:ErrorWhileAssigningOrder');
        },
      });
  }

  reOrder(orderId: string) {
    const order = this.orderControlList.items.find(x => x.orderId === orderId);
    if (order?.orderStatus !== OrderStatus.Complete) {
      this.toasterService.error('::OrderControl:OnlyCompletedOrderCanBeReordered');
      return;
    }
    this.router.navigateByUrl('/pos', {
      state: {
        orderId: orderId,
        action: OrderActionType.ReOrderForCompletedOrder,
      },
    });
  }

  onReDelivery(orderId: string, orderType: OrderType) {
    this.router.navigateByUrl('/pos', {
      state: {
        orderId: orderId,
        action: OrderActionType.ReOrderForCancelledItem,
        orderType: orderType,
      },
    });
  }

  changeSort(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
    this.loadOrderList();
  }

  generateReport() {
    const dateRange = this.getValidatedDateRange();
    if (!dateRange) return;

    if (!dateRange.fromDate || !dateRange.toDate) {
      this.toasterService.error('::OrderControl:DateRequired');
      return;
    }

    this.fromDate = dateRange.fromDate;
    this.toDate = dateRange.toDate;

    const input = {
      fromDate: this.fromDate,
      toDate: this.toDate,
      filterDateCategory: FilterDateCategory.OrderDate,
    } as FilterPagedAndSortedOrderControlListResultRequestDto;

    const filters = {
      fromDate: this.fromDate,
      toDate: this.toDate,
      filterDateCategory: FilterDateCategory.OrderDate,
    } as ReportFilterDto;

    this.orderMasterListReportService.generateReport(input, filters);
  }

  private getValidatedDateRange(): { fromDate: string | null; toDate: string | null } | null {
    const fromDateValue = new Date(this.filterForm.value.fromDate);
    const toDateValue = this.filterForm.value.toDate;

    if (fromDateValue > toDateValue) {
      this.toasterService.error('::OrderControl:DateValidation');
      return null;
    }
    return {
      fromDate: fromDateValue.toDateString(),
      toDate: toDateValue.toDateString(),
    };
  }

  downloadPdf(): void {
    const dateRange = this.getValidatedDateRange();
    const input = {
      fromDate: dateRange.fromDate,
      toDate: dateRange.toDate,
    } as FilterPagedAndSortedOrderControlListResultRequestDto;

    this.orderControlCSVService.exportOrderControlXlsx(input);
  }
}
