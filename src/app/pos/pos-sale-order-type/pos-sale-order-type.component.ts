import { Component, OnDestroy, OnInit } from '@angular/core';
import { OrderType, orderTypeOptions } from '@proxy/orders';
import { SharedDataService } from '../shared-data.service';
import { Subject, takeUntil } from 'rxjs';
import { OrderActionType } from 'src/app/order-control-list/models/order-action-type.enum';
import { sortEnumValues } from 'src/app/shared/common-utils';

@Component({
  selector: 'app-pos-sale-order-type',
  templateUrl: './pos-sale-order-type.component.html',
  styleUrl: './pos-sale-order-type.component.scss',
})
export class PosSaleOrderTypeComponent implements OnInit, OnDestroy {
  selectedOrderType: OrderType = OrderType.SW;
  orderTypes = sortEnumValues(orderTypeOptions);
  destroy$: Subject<void> = new Subject();
  orderAction: OrderActionType;
  orderActionType = OrderActionType;
  orderType = OrderType;

  readonly allowedOrderTypes: OrderType[] = [
    OrderType.DO,
    OrderType.PO,
    OrderType.PU,
    OrderType.SO,
    OrderType.SW,
    OrderType.PHO,
  ];

  constructor(private sharedDataService: SharedDataService) {}

  ngOnInit(): void {
    this.sharedDataService.orderSummary.pipe(takeUntil(this.destroy$)).subscribe(x => {
      if (x) {
        this.selectedOrderType = x.orderType;
      }
    });

    this.getReOrderAction();

    this.sharedDataService.resetOrderTypeAction$.pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res) this.orderAction = null;
    });
  }

  onOrderTypeSelectionChange() {
    this.sharedDataService.updateOrderType(this.selectedOrderType);
    this.sharedDataService.broadcastOrderSummary();
  }

  getReOrderAction() {
    const { orderId, action } = window.history.state || {};
    if (!orderId || !action) return;

    this.orderAction = action;
  }

  isOrderTypeDisabled(value: OrderType): boolean {
    return !this.allowedOrderTypes.includes(value);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
