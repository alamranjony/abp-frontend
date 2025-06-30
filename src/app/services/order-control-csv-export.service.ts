import { Injectable, OnDestroy } from '@angular/core';
import * as XLSX from 'xlsx';
import { Subject, takeUntil } from 'rxjs';
import { ToasterService } from '@abp/ng.theme.shared';
import {
  deliveryCategoryOptions,
  FilterPagedAndSortedOrderControlListResultRequestDto,
  OrderService,
  orderStatusOptions,
  OrderType,
  orderTypeOptions,
  SubOrderControlListDto,
  subOrderDeliveryStatusOptions,
} from '@proxy/orders';

@Injectable({
  providedIn: 'root',
})
export class OrderControlCsvExportService implements OnDestroy {
  private destroy$: Subject<void> = new Subject();

  constructor(
    private orderService: OrderService,
    private toasterService: ToasterService,
  ) {}

  exportOrderControlXlsx(input: FilterPagedAndSortedOrderControlListResultRequestDto): void {
    this.orderService
      .getAllOrdersToExport(input)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.exportToXlsx(data.items);
        },
        error: () => {
          this.toasterService.error('::Export.Error');
        },
      });
  }

  exportToXlsx(orders: SubOrderControlListDto[]): void {
    const headers: string[] = [
      'Order_Number',
      'Order_Type',
      'Sales_Rep',
      'Customer',
      'Recipient',
      'Address',
      'Product',
      'Amount',
      'Order_Total',
      'Delivery_Date',
      'Order_Status',
      'Delivery_Status',
      'Delivery_Category',
      'Fulfilling_Store',
      'Original_Store',
    ];

    const rows = orders.map(order => [
      order.orderNumber,
      this.getEnumDisplayName(orderTypeOptions, order.orderType),
      order.salesRepresentative,
      order.customerName,
      order.recipient ?? '-',
      (order.orderType !== OrderType.IV ? order.deliveryAddress : order.customerFullAddress) ?? '-',
      order.productName,
      order.amount,
      order.orderTotal,
      order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : '',
      this.getEnumDisplayName(orderStatusOptions, order.orderStatus),
      this.getEnumDisplayName(subOrderDeliveryStatusOptions, order.subOrderDeliveryStatus),
      this.getEnumDisplayName(deliveryCategoryOptions, order.deliveryCategory),
      order.fulfillingStoreName ?? '-',
      order.originalStoreName ?? '-',
    ]);

    const timestamp = new Date()
      .toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })
      .replace(/[/, ]/g, '_')
      .replace(/:/g, '_');

    const filename = `Order_Control_${timestamp}.xlsx`;
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
    XLSX.writeFile(workbook, filename);
  }

  private getEnumDisplayName(enumOptions: any[], enumValue: number): string {
    const option = enumOptions.find(option => option.value === enumValue);
    return option ? option.key : '-';
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
