import { Component, Input, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ProductStockDto, ProductStockService, UpdateProductStockDto } from '@proxy/products';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-product-stock',
  templateUrl: './product-stock.component.html',
  styleUrls: ['./product-stock.component.scss'],
})
export class ProductStockComponent implements OnDestroy {
  productStocks: ProductStockDto[] = [];
  columns: string[] = ['storeName', 'onHandQuantity', 'onOrderQuantity', 'actions'];
  editRowId: string;
  rowFormGroup: FormGroup[] = [];
  destroy$: Subject<void> = new Subject();

  @Input() set productId(value: string) {
    if (!value) return;
    this.getProductStocks(value);
  }

  constructor(
    private fb: FormBuilder,
    private productStockService: ProductStockService,
  ) {}

  getProductStocks(productId: string): void {
    this.productStockService
      .getAllStoreWiseProductStocks(productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((productStocks: ProductStockDto[]) => {
        this.productStocks = productStocks;
        this.rowFormGroup = productStocks.map(item => {
          return this.fb.group({
            storeId: [item.storeId],
            quantity: [item.quantity],
            onOrderQuantity: [item.onOrderQuantity],
            onHandQuantity: [item.onHandQuantity],
            storeName: [item.storeName],
            productId: [item.productId],
          });
        });
      });
  }

  startEdit(element: ProductStockDto): void {
    this.editRowId = element.storeId;
  }

  saveEdit(storeId: string): void {
    const productStockDto = this.rowFormGroup.find(x => x.get('storeId')?.value === storeId)?.value;

    if (!productStockDto) return;
    let updateProductStockDto: UpdateProductStockDto = {
      productId: productStockDto.productId,
      onHandQuantity: productStockDto.onHandQuantity,
      onOrderQuantity: productStockDto.onOrderQuantity,
    };

    this.productStockService
      .updateProductStockByStoreId(productStockDto.storeId, updateProductStockDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.editRowId = null;
        this.getProductStocks(updateProductStockDto.productId);
      });
  }

  cancelEdit(): void {
    this.editRowId = null;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
