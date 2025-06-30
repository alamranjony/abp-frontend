import { ToasterService } from '@abp/ng.theme.shared';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  DesignerOrderService,
  DesignerSubOrderControlListDto,
  DesignStatus,
  SubOrderService,
  UpdateSubOrderDetailsDto,
} from '@proxy/orders';
import { Subject, takeUntil } from 'rxjs';
import { SharedModule } from 'src/app/shared/shared.module';
import { BackButtonComponent } from '../../shared/components/back-button/back-button.component';

@Component({
  selector: 'app-designer-order-details',
  standalone: true,
  imports: [SharedModule, BackButtonComponent],
  templateUrl: './designer-order-details.component.html',
  styleUrl: './designer-order-details.component.scss',
})
export class DesignerOrderDetailsComponent implements OnInit, OnDestroy {
  order: DesignerSubOrderControlListDto;
  orderDetails: string;
  private destroy$: Subject<void> = new Subject();
  recipeProductColumns: string[] = [
    'productCode',
    'description',
    'basePrice',
    'quantity',
    'totalPrice',
    'comments',
  ];
  readonly designStatus = DesignStatus;

  constructor(
    private designerOrderService: DesignerOrderService,
    private subOrderService: SubOrderService,
    private toasterService: ToasterService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.getOrderDetailsBySubOrderNumber();
  }

  private getOrderDetailsBySubOrderNumber() {
    const subOrderNumber = this.route.snapshot.params['id'];
    this.designerOrderService
      .getDesignerOrderDetails(subOrderNumber)
      .pipe(takeUntil(this.destroy$))
      .subscribe(orderDetails => {
        this.order = orderDetails;
        this.orderDetails = this.order.orderDetails;
      });
  }

  saveOrderDetails(): void {
    const updatedSubOrder: UpdateSubOrderDetailsDto = {
      orderDetails: this.orderDetails,
    };
    this.subOrderService
      .updateSubOrderDetails(this.order.subOrderId, updatedSubOrder)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toasterService.success('::UpdateSuccess');
        },
        error: () => {
          this.toasterService.error('::SubOrderItem.UpdateError');
        },
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
