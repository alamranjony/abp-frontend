import { ConfigStateService, CurrentUserDto } from '@abp/ng.core';
import { ToasterService } from '@abp/ng.theme.shared';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { Router } from '@angular/router';
import { CategoryType, CheckoutBoxDetailsDto, CheckoutBoxService } from '@proxy/checkout-box';
import { OrderService, OrderStatus } from '@proxy/orders';
import { Subject, takeUntil } from 'rxjs';
import { EXPORT_CONFIG } from 'src/app/export/export-config';
import { OrderActionType } from 'src/app/order-control-list/models/order-action-type.enum';
import { formatDate } from 'src/app/shared/date-time-utils';
import { SharedModule } from 'src/app/shared/shared.module';
import { MatToolbar } from '@angular/material/toolbar';

@Component({
  selector: 'app-checkout-box-details',
  standalone: true,
  imports: [SharedModule, MatToolbar],
  templateUrl: './checkout-box-details.component.html',
  styleUrl: './checkout-box-details.component.scss',
})
export class CheckoutBoxDetailsComponent implements OnInit, OnDestroy {
  destroy$: Subject<void> = new Subject();
  checkoutBoxDetails: CheckoutBoxDetailsDto[];
  selectedOrders: string[] = [];
  displayedColumns: Set<string> = new Set();
  categoryType: CategoryType;
  category = CategoryType;
  stores: string[];
  private currentUser: CurrentUserDto;
  exportUrl = EXPORT_CONFIG.checkoutBoxListUrl;
  csvFileName = `CheckoutBox_Details_${formatDate(new Date().toDateString())}`;
  exportFieldList: string[] = [];
  displayNameForExportedColumns: string[] = [];
  exportDisplayNameMap: Record<string, string> = {
    orderNumber: 'Order_Number',
    occasionCode: 'Occasion',
    deliveryDate: 'Delivery_Date',
    city: 'City',
    state: 'State',
    recipientName: 'Recipient_Name',
    productDescription: 'Product_Description',
    orderAmount: 'Order_Amount',
    wireService: 'WireService',
    reason: 'Reason',
    florist: 'Florist',
    shopCode: 'Shop_Code',
    messageType: 'Message_Type',
    messageText: 'Message_Text',
    employeeName: 'Employee_Name',
    orderStatus: 'Order_Status',
    controlNo: 'Control_No',
    assignedUserId: 'Assigned_User_Id',
  };

  constructor(
    private checkoutBoxService: CheckoutBoxService,
    private configState: ConfigStateService,
    private toasterService: ToasterService,
    private router: Router,
    private orderService: OrderService,
  ) {
    this.currentUser = this.configState.getOne('currentUser') as CurrentUserDto;
  }

  ngOnInit(): void {
    const { categoryType, stores } = window.history.state || {};
    if (!categoryType && !stores) {
      const categoryTypeString = sessionStorage.getItem('categoryType');
      const storesString = sessionStorage.getItem('stores');
      this.categoryType = Number(categoryTypeString) as CategoryType;
      this.stores = JSON.parse(storesString);
    } else {
      this.categoryType = categoryType;
      this.stores = stores;
    }

    if (this.categoryType && this.stores) {
      sessionStorage.setItem('categoryType', this.categoryType.toString());
      sessionStorage.setItem('stores', JSON.stringify(this.stores));

      this.setDisplayedColumns(this.categoryType);
      this.getCheckoutBoxDetails(this.categoryType, this.stores);
    }
  }

  isSelected(element: CheckoutBoxDetailsDto): boolean {
    return this.selectedOrders.includes(element.orderId);
  }

  toggleSelection(element: CheckoutBoxDetailsDto) {
    const index = this.selectedOrders.indexOf(element.orderId);
    if (index >= 0) {
      this.selectedOrders.splice(index, 1);
    } else {
      this.selectedOrders.push(element.orderId);
    }
  }

  toggleSelectAll(event: MatCheckboxChange) {
    if (event.checked) {
      this.selectedOrders = this.checkoutBoxDetails.map(item => item.orderId);
    } else {
      this.selectedOrders = [];
    }
  }

  isAllSelected(): boolean {
    return (
      this.checkoutBoxDetails?.length > 0 &&
      this.selectedOrders.length === this.checkoutBoxDetails.length
    );
  }

  isSomeSelected(): boolean {
    return (
      this.selectedOrders.length > 0 && this.selectedOrders.length < this.checkoutBoxDetails.length
    );
  }

  private getCheckoutBoxDetails(categoryType: CategoryType, stores: string[]) {
    this.checkoutBoxService
      .getCheckoutBoxDetailsList(categoryType, stores)
      .pipe(takeUntil(this.destroy$))
      .subscribe(details => {
        this.checkoutBoxDetails = details;
      });
  }

  private setDisplayedColumns(categoryType: CategoryType) {
    const primaryColumns = ['select'];
    const trailingColumn = ['actions'];
    const secondaryColumns = [
      'orderNumber',
      'occasionCode',
      'deliveryDate',
      'city',
      'state',
      'recipientName',
      'productDescription',
      'orderAmount',
    ];

    let columns: string[] = [];

    switch (categoryType) {
      case CategoryType.PendingWireOuts:
        columns = [
          ...primaryColumns,
          ...secondaryColumns,
          'wireService',
          'orderStatus',
          ...trailingColumn,
        ];
        break;
      case CategoryType.PendingPhoneOut:
        columns = [...primaryColumns, ...secondaryColumns, 'wireService', ...trailingColumn];
        break;
      case CategoryType.RejectsAndProblemWireOut:
        columns = [
          ...primaryColumns,
          ...secondaryColumns,
          'wireService',
          'reason',
          ...trailingColumn,
        ];
        break;
      case CategoryType.PendingFloristCorrespondence:
        columns = [
          ...primaryColumns,
          ...secondaryColumns,
          'control',
          'wireService',
          'florist',
          'messageType',
          'messageText',
          ...trailingColumn,
        ];
        break;
      case CategoryType.OrdersToBeCleaned:
        columns = [
          ...primaryColumns,
          ...secondaryColumns,
          'control',
          'wireService',
          'florist',
          'shopCode',
          ...trailingColumn,
        ];
        break;
      case CategoryType.EmployeeOrdersReview:
        columns = [...primaryColumns, ...secondaryColumns, 'employeeName', ...trailingColumn];
        break;
      case CategoryType.SpecialHandlingOrders:
        columns = [...primaryColumns, ...secondaryColumns, 'wireService', ...trailingColumn];
        break;
      case CategoryType.DeliveryProblems:
        columns = [
          ...primaryColumns,
          ...secondaryColumns,
          'employeeName',
          'reason',
          ...trailingColumn,
        ];
        break;
      case CategoryType.GeneralMessages:
        columns = [
          ...primaryColumns,
          ...secondaryColumns,
          'employeeName',
          'reason',
          ...trailingColumn,
        ];
        break;
      default:
        columns = [...primaryColumns, ...secondaryColumns, ...trailingColumn];
    }
    this.displayedColumns = new Set(columns);
    const excludedColumns = ['actions', 'select'];
    this.exportFieldList = [...this.displayedColumns].filter(col => !excludedColumns.includes(col));
    this.displayNameForExportedColumns = this.exportFieldList.map(
      field => this.exportDisplayNameMap[field] ?? field,
    );
  }

  openInOrderEntry(orderId: string) {
    const allowedOrderStatusesForOpeningInOrderEntry = [
      OrderStatus.Abandoned,
      OrderStatus.Hold,
      OrderStatus.Review,
      OrderStatus.InProgress,
    ];

    const order = this.checkoutBoxDetails.find(x => x.orderId === orderId);
    if (order.assignedUserId && order.assignedUserId !== this.currentUser.id) {
      this.toasterService.error('::OrderControl:AssignedToOtherUser');
      return;
    }

    if (!allowedOrderStatusesForOpeningInOrderEntry.includes(order.orderStatus)) {
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

  releaseOrder(categoryType: CategoryType) {
    if (this.selectedOrders.length === 0) {
      this.toasterService.error('::CheckoutBox:ReleaseOrdersNoOrder');
      return;
    }

    this.orderService
      .releaseOrders(this.selectedOrders, categoryType)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.getCheckoutBoxDetails(categoryType, this.stores);
        this.toasterService.success('::CheckoutBox:ReleaseOrdersSuccess');
      });
  }

  onCancel(): void {
    this.router.navigate(['checkout-box']);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
