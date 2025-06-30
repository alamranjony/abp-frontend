import { ToasterService } from '@abp/ng.theme.shared';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SubOrderDto, SubOrderService, UpdateSubOrderDetailsDto } from '@proxy/orders';
import { ProductCategoryType, ProductStockService } from '@proxy/products';
import { Subject, switchMap, takeUntil } from 'rxjs';

@Component({
  selector: 'app-pos-product-details',
  templateUrl: './pos-product-details.component.html',
  styleUrl: './pos-product-details.component.scss',
})
export class PosProductDetailsComponent implements OnInit, OnDestroy {
  isEditing = false;
  bouquetCount: number;
  productCategoryType = ProductCategoryType;
  orderDetails: string;
  destroy$: Subject<void> = new Subject();
  subOrder: SubOrderDto;
  maxInteger = Math.pow(2, 31) - 1;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private subOrderService: SubOrderService,
    private toasterService: ToasterService,
    private productStockService: ProductStockService,
  ) {}

  ngOnInit(): void {
    if (this.data.hasRecipes && !this.data.isAllowPartialStockSale)
      this.productStockService
        .getBouquetStockCount(this.data.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe(x => (this.bouquetCount = x));

    if (this.data.subOrderId) {
      this.subOrderService
        .get(this.data.subOrderId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(subOrder => {
          this.subOrder = subOrder;
          this.orderDetails = subOrder.orderDetails;
        });
    }
  }

  defaultImageURL = '/assets/images/demo/demo.png';

  handleImageError(event: any) {
    event.target.src = this.defaultImageURL;
  }

  toggleEdit(): void {
    this.isEditing = true;
  }

  saveDetails(): void {
    this.data.description = this.orderDetails;
    this.isEditing = false;
    this.subOrderService
      .get(this.data.subOrderId)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(subOrder => {
          const updatedSubOrder: UpdateSubOrderDetailsDto = {
            orderDetails: this.orderDetails,
          };
          return this.subOrderService.updateSubOrderDetails(subOrder.id, updatedSubOrder);
        }),
      )
      .subscribe({
        next: () => this.toasterService.success('::UpdateSuccess'),
        error: () => this.toasterService.error('::Product.UpdateError'),
      });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
