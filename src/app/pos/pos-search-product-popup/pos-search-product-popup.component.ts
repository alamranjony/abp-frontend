import { Component, ViewChild, ElementRef, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { PosProductDetailsComponent } from '../pos-product-details/pos-product-details.component';
import { SharedDataService } from '../shared-data.service';
import {
  ProductCategoryType,
  ProductDto,
  ProductService,
  ProductStockService,
} from '@proxy/products';
import { ProductItem } from 'src/app/products/product.model';
import { PosGiftcardPopupComponent } from '../pos-giftcard-popup/pos-giftcard-popup.component';
import { PictureSizeType } from '@proxy/pictures';
import { OrderSummary } from '../models/order-summary.model';
import { ToasterService } from '@abp/ng.theme.shared';

@Component({
  selector: 'app-pos-search-product-popup',
  templateUrl: './pos-search-product-popup.component.html',
  styleUrl: './pos-search-product-popup.component.scss',
})
export class PosSearchProductPopupComponent implements OnInit {
  products: ProductItem[] = [];
  searchKey: string;
  defaultImageURL = 'assets/images/demo/demo.png';
  sortColumn: string = 'Name';
  @ViewChild('autoFocusInput') autoFocusInput!: ElementRef;
  isAddToOrderBtnDisabled: boolean = false;
  orderSummary: OrderSummary;
  ProductCategoryType = ProductCategoryType;
  maxInt = Math.pow(2, 31) - 1;

  constructor(
    public dialog: MatDialog,
    private sharedDataService: SharedDataService,
    private productService: ProductService,
    private productStockService: ProductStockService,
    private toasterService: ToasterService,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      searchKey: string;
    },
  ) {}

  ngOnInit(): void {
    this.searchKey = this.data.searchKey;
    this.getProductsBySearchKey(this.searchKey);
    this.sharedDataService.orderSummary.subscribe((x: OrderSummary) => {
      this.orderSummary = x;
      if (x.subOrderItems.length > 0) this.isAddToOrderBtnDisabled = false;
    });
  }

  showProductDetails(product: ProductItem, hideSection: boolean = false): void {
    this.dialog.open(PosProductDetailsComponent, {
      width: '700px',
      data: { ...product, hideSection },
    });
  }

  addToOrder(product: ProductItem): void {
    this.productStockService.checkValidProductStock(product.id, 1).subscribe(validProduct => {
      if (validProduct) {
        const hasGiftCard = this.orderSummary.subOrderItems.some(
          item => item.productItem.productCategoryType === ProductCategoryType.GiftCard,
        );
        const hasFlower = this.orderSummary.subOrderItems.some(
          item =>
            !item.productItem.productCategoryType ||
            item.productItem.productCategoryType === ProductCategoryType.Flower ||
            item.productItem.productCategoryType === ProductCategoryType.AddOn,
        );

        if (
          (product.productCategoryType === ProductCategoryType.GiftCard && hasFlower) ||
          ((!product.productCategoryType ||
            product.productCategoryType === ProductCategoryType.Flower ||
            product.productCategoryType === ProductCategoryType.AddOn) &&
            hasGiftCard)
        ) {
          this.toasterService.warn('::Pos:MultipleProductTypeError');
          return;
        }
        if (
          product.onHandQuantity === 0 &&
          !product.hasRecipes &&
          (!product.productCategoryType ||
            product.productCategoryType === ProductCategoryType.Flower ||
            product.productCategoryType === ProductCategoryType.AddOn)
        ) {
          this.toasterService.error('::Pos:QuantityError');
          return;
        }

        if (this.orderSummary.subOrderItems.length === 0) this.isAddToOrderBtnDisabled = true;

        if (product.productCategoryType === ProductCategoryType.GiftCard) {
          let dialogRef = this.dialog.open(PosGiftcardPopupComponent, {
            width: '1200px',
            data: { ...product },
          });

          dialogRef.afterClosed().subscribe(data => {
            if (data) {
              data.added = true;
              this.sharedDataService.addProduct(data as ProductItem);
            }
            this.dialog.closeAll();
          });
          return;
        }
        product.added = true;
        this.sharedDataService.addProduct(product);
      } else this.toasterService.error('::Pos:ProductStockUpdateError');
    });
  }

  getProductsBySearchKey(searchKey: string) {
    this.productService
      .getProductsBySearchKey(searchKey, this.sortColumn, PictureSizeType.Thumbnail)
      .subscribe({
        next: (products: ProductDto[]) => {
          this.products = products.map(x => x as ProductItem);
        },
        error: () => {},
      });
  }

  onSortSelectionChange() {
    this.getProductsBySearchKey(this.searchKey);
  }

  onSearch(filter: string) {
    this.searchKey = filter;
    this.getProductsBySearchKey(this.searchKey);
  }

  handleImageError(event: any) {
    event.target.src = this.defaultImageURL;
  }
}
