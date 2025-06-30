import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PosSearchProductPopupComponent } from '../pos-search-product-popup/pos-search-product-popup.component';
import { SharedDataService } from '../shared-data.service';
import { ProductDto, ProductService } from '@proxy/products';
import { ProductItem } from 'src/app/products/product.model';
import { PosGiftcardPopupComponent } from '../pos-giftcard-popup/pos-giftcard-popup.component';
import { PictureSizeType } from '@proxy/pictures';
import { EmployeeService } from '@proxy/employees';
import { ToasterService } from '@abp/ng.theme.shared';
import { OrderSummary } from '../models/order-summary.model';

@Component({
  selector: 'app-pos-top-bar',
  templateUrl: './pos-top-bar.component.html',
  styleUrl: './pos-top-bar.component.scss',
})
export class PosTopBarComponent implements OnInit {
  isProductAdded: boolean = false;
  isGenericUser: boolean = false;
  orderSummary: OrderSummary;
  employeeId: string = '';
  @ViewChild('searchKeyRef') searchKeyRef!: ElementRef;
  private readonly validKeys = ['GC', 'GIFT CARD', 'GIFTCARD'];

  constructor(
    public dialog: MatDialog,
    private sharedDataService: SharedDataService,
    private productService: ProductService,
    private employeeService: EmployeeService,
    private toasterService: ToasterService,
  ) {}

  ngOnInit(): void {
    this.sharedDataService.currentProducts.subscribe(products => {
      this.isProductAdded = products.length > 0;
    });
    this.sharedDataService.orderSummary.subscribe(order => {
      this.orderSummary = order;
    });

    this.employeeService
      .isGenericUser()
      .subscribe(isGenericUser => (this.isGenericUser = isGenericUser));
  }

  showProductList(searchKey: string): void {
    if (this.validKeys.includes(searchKey.toUpperCase())) {
      this.showPosGiftcardPopup();
      return;
    }

    let dialogRef = this.dialog.open(PosSearchProductPopupComponent, {
      width: '1200px',
      data: { searchKey: searchKey },
    });

    dialogRef.afterClosed().subscribe(() => {
      this.searchKeyRef.nativeElement.value = '';
    });
  }

  onEnterPressed(event: KeyboardEvent): void {
    let searchKey = (event.target as HTMLInputElement).value?.trim();

    if (searchKey.length === 0) {
      this.showProductList(searchKey);
      return;
    }

    if (this.validKeys.includes(searchKey.toUpperCase())) {
      this.showPosGiftcardPopup();
      return;
    }

    this.productService
      .getProductByProductCodeAndName(searchKey, PictureSizeType.Thumbnail)
      .subscribe({
        next: (product: ProductDto) => {
          if (product) {
            this.sharedDataService.addProduct(product as ProductItem);
          } else {
            this.showProductList(searchKey);
          }
        },
        error: () => {},
      });
  }

  showPosGiftcardPopup() {
    this.productService
      .getDefaultGiftCardProductItemByPictureSizeType(PictureSizeType.Thumbnail)
      .subscribe(data => {
        let dialogRef = this.dialog.open(PosGiftcardPopupComponent, {
          width: '1200px',
          data: { ...data },
        });

        dialogRef.afterClosed().subscribe(data => {
          if (data) {
            data.added = true;
            this.sharedDataService.addProduct(data as ProductItem);
          }
        });
      });
  }

  onEnterPressedForEmployeeId(): void {
    if (!this.employeeId?.trim()) {
      this.toasterService.error('::Pos:GenericLoginEmployeeIdNotFound');
      return;
    }

    this.employeeService.getEmployeeByEmployeeId(this.employeeId).subscribe({
      next: employee => {
        if (employee) {
          this.toasterService.success('::Pos:EmployeeIdForGenericUserFound');
          this.sharedDataService.setEmployeeId(this.employeeId);
          this.sharedDataService.broadcastOrderSummary();
        } else this.toasterService.error('::Pos:InvalidEmployeeId');
      },
      error: () => {
        this.toasterService.error('::Pos:EmployeeIdValidateError');
      },
    });
  }
}
