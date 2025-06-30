import { ToasterService } from '@abp/ng.theme.shared';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { ActivatedRoute, Router } from '@angular/router';
import { wireServiceOptions } from '@proxy/common';
import { ProductDto } from '@proxy/products';
import { CreateUpdateShopDeliveryDetailDto } from '@proxy/shop-delivery-details';
import { CreateUpdateShopDto, ShopDto, ShopService } from '@proxy/shops';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { SharedModule } from 'src/app/shared/shared.module';
import { BackButtonComponent } from '../../shared/components/back-button/back-button.component';
import { DEBOUNCE_TIME } from 'src/app/shared/constants';
import { CreateUpdateShopProductDto, ProductListRequestDto } from '@proxy/shop-products';
import { ListService, PagedResultDto } from '@abp/ng.core';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-shop-create-update-component',
  standalone: true,
  imports: [SharedModule, BackButtonComponent],
  templateUrl: './shop-create-update-component.component.html',
  styleUrl: './shop-create-update-component.component.scss',
  providers: [ListService],
})
export class ShopCreateUpdateComponentComponent implements OnInit, OnDestroy {
  form: FormGroup;
  wireService = wireServiceOptions;
  shop: ShopDto;
  isAddMode = false;
  id: string;
  zipCodesControl = this.fb.control([]);
  destroy$: Subject<void> = new Subject();
  saveClicked = false;
  filteredProducts: ProductDto[] = [];
  addedProducts: ProductDto[] = [];
  shopProducts = { items: [], totalCount: 0 } as PagedResultDto<ProductDto>;
  createUpdateShopProducts: CreateUpdateShopProductDto[] = [];
  productCodeChanged: Subject<string> = new Subject<string>();

  shopProductAddedColumns: string[] = ['code', 'name', 'description', 'sku', 'actions'];
  shopProductColumns: string[] = ['code', 'name', 'description', 'sku'];

  constructor(
    private readonly fb: FormBuilder,
    private readonly shopService: ShopService,
    private toaster: ToasterService,
    private route: ActivatedRoute,
    private router: Router,
    readonly list: ListService,
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.params['shopId'];
    this.isAddMode = !this.id;
    this.buildForm();
    if (!this.isAddMode) this.getShop();
    this.productCodeChanged.pipe(debounceTime(DEBOUNCE_TIME)).subscribe(value => {
      this.onProductCodeNumberChanged(value);
    });
  }

  changePage(pageEvent: PageEvent) {
    this.list.page = pageEvent.pageIndex;
    this.loadShopProducts();
  }

  private loadShopProducts() {
    this.list
      .hookToQuery(query =>
        this.shopService.getShopProductsList({
          ...query,
          shopId: this.id,
        }),
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.shopProducts = response;
      });
  }

  private getShop() {
    this.shopService
      .get(this.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.shop = response;
        if (this.shop.isShopInTeleFlora && !this.shopProductColumns.includes('price')) {
          this.shopProductColumns.push('price');
        }
        this.form.patchValue(response);
        this.shopProducts = response.shopProductDtos;
        if (this.shop.zipCodes) {
          const zipCodes = this.shop.zipCodes.split(',').map((zipCode: string) => zipCode.trim());
          this.zipCodesControl.setValue(zipCodes);
        }

        if (this.shop.shopDeliveryDetails) this.setDeliveryDetails(this.shop.shopDeliveryDetails);
      });
  }

  private buildForm() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      shopCode: ['', Validators.required],
      zipCode: ['', Validators.required],
      email: [''],
      phone: [''],
      isFFC: [false],
      openSunday: [false],
      orderSent: [0],
      orderReceived: [0],
      orderRejected: [0],
      wireServiceId: [null, Validators.required],
      isPreferred: [false],
      isActive: [false],
      isBlocked: [false],
      zipCodes: [''],
      searchProductCode: [''],
      isShopInBloomNet: [false],
      isShopInFTD: [false],
      isShopInFSN: [false],
      isShopInMAS: [false],
      isShopInTeleFlora: [false],
      createUpdateShopDeliveryDetails: this.fb.array([]),
    });
  }

  save(): void {
    if (this.form.valid) this.form.get('zipCodes')?.setValue(this.zipCodesControl.value.join(','));
    else {
      this.form.markAllAsTouched();
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }

    if (!this.isAddMode) {
      this.createUpdateShopProducts = this.addedProducts.map(product => ({
        productId: product.id,
      }));
    }

    const formData = {
      ...this.form.value,
      createUpdateShopProducts: this.createUpdateShopProducts,
    } as CreateUpdateShopDto;

    const request = this.isAddMode
      ? this.shopService.create(formData)
      : this.shopService.update(this.id, formData);

    request.pipe(takeUntil(this.destroy$)).subscribe({
      next: data => {
        const successMessage = this.isAddMode ? '::Recipe.AddedSuccess' : '::Recipe.UpdatedSuccess';
        this.toaster.success(successMessage);
        this.componentState(data, !this.isAddMode);
      },
    });
  }

  componentState(res: any, isEdit: boolean) {
    if (this.saveClicked) {
      this.router.navigate(['/shops']);
      return;
    }
    if (isEdit) {
      let currentUrl = this.router.url;
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigate([currentUrl]);
      });
    } else {
      this.router.navigate(['shops/edit', res?.id]);
    }
  }

  onCancel() {
    this.router.navigate(['/shops']);
  }

  onSaveClick() {
    this.saveClicked = true;
    this.save();
  }

  onSaveAndContinueClick() {
    this.saveClicked = false;
    this.save();
  }

  addZipCode(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value) {
      const zipCode = parseInt(value, 10);
      const zipCodes = this.zipCodesControl.value;

      if (!isNaN(zipCode) && !zipCodes.includes(zipCode)) {
        this.zipCodesControl.setValue([...zipCodes, zipCode]);
        this.updateZipCodes();
      }
    }
    event.chipInput!.clear();
  }

  removeZipCode(zipCode: number): void {
    const zipCodes = this.zipCodesControl.value;
    const updatedZipCodes = zipCodes.filter((c: number) => c !== zipCode);

    this.zipCodesControl.setValue(updatedZipCodes);
    this.updateZipCodes();
  }

  updateZipCodes(): void {
    this.form.get('zipCodes')?.setValue(this.zipCodesControl.value.join(','));
  }

  get deliveryDetailsControls() {
    return (this.form.get('createUpdateShopDeliveryDetails') as FormArray).controls;
  }

  setDeliveryDetails(deliveryDetails: CreateUpdateShopDeliveryDetailDto[]) {
    const deliveryDetailsFGs = deliveryDetails.map(deliveryDetail => this.fb.group(deliveryDetail));
    const deliveryDetailFormArray = this.fb.array(deliveryDetailsFGs);
    this.form.setControl('createUpdateShopDeliveryDetails', deliveryDetailFormArray);

    (this.form.get('createUpdateShopDeliveryDetails') as FormArray).controls.forEach(control => {
      this.updateWorkingDayControls(control);
      this.updateHolidayControls(control);

      control.get('isCloseOnWorkingDay')?.valueChanges.subscribe(() => {
        this.updateWorkingDayControls(control);
      });

      control.get('isCloseOnHoliday')?.valueChanges.subscribe(() => {
        this.updateHolidayControls(control);
      });
    });
  }

  private updateWorkingDayControls(control: AbstractControl) {
    const isClose = control.get('isCloseOnWorkingDay')?.value;
    if (isClose) {
      control.get('workingDayStartTime')?.disable();
      control.get('workingDayEndTime')?.disable();
    } else {
      control.get('workingDayStartTime')?.enable();
      control.get('workingDayEndTime')?.enable();
    }
  }

  private updateHolidayControls(control: AbstractControl) {
    const isClose = control.get('isCloseOnHoliday')?.value;
    if (isClose) {
      control.get('holidayStartTime')?.disable();
      control.get('holidayEndTime')?.disable();
    } else {
      control.get('holidayStartTime')?.enable();
      control.get('holidayEndTime')?.enable();
    }
  }

  private onProductCodeNumberChanged(value: string) {
    if (!value?.trim()) return;
    this.shopService
      .getProductsByCode(value, this.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: product => {
          this.filteredProducts = product;
        },
        error: () => {
          this.filteredProducts = [];
        },
      });
  }

  addProductToShop(product: ProductDto) {
    if (this.addedProducts.some(p => p.id === product.id)) {
      this.toaster.error('::Shop:ProductExists');
      return;
    }

    this.addedProducts = [...this.addedProducts, product];
    this.form.get('searchProductCode')?.setValue('');
    this.filteredProducts = [];
  }

  removeProductFromShop(index: number) {
    this.addedProducts = this.addedProducts.filter((_, i) => i !== index);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
