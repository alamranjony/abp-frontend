import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ProductCategoryType,
  productCategoryTypeOptions,
  ProductDto,
  ProductService,
  productStatusOptions,
  unitOfMeasureOptions,
} from '@proxy/products';
import { ToasterService } from '@abp/ng.theme.shared';
import * as moment from 'moment';
import { isGuidNullOrEmpty } from 'src/app/services/helper/guid-helper';
import { wireServiceOptions } from '@proxy/common';
import { PictureSizeType } from '@proxy/pictures';
import { GIFTCARD_DEFAULT_PRODUCT_CODE } from 'src/app/shared/constants';
import { sortEnumValues } from 'src/app/shared/common-utils';
import { StoreLookupDto } from '@proxy/stores';
import {
  CorporateSettingDto,
  CorporateSettingService,
  InventoryTrackingType,
  RecipeInventoryManageType,
} from '@proxy/corporate-settings';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-product-add-edit-form',
  templateUrl: './product-add-edit-form.component.html',
  styleUrl: './product-add-edit-form.component.scss',
})
export class ProductAddEditFormComponent implements OnInit, OnDestroy {
  @Input() title: string;
  @Input() model!: ProductDto;
  saveClicked = false;
  form!: FormGroup;
  isLoading = true;
  productStatuses = sortEnumValues(productStatusOptions);
  wireServices = sortEnumValues(wireServiceOptions);
  unitOfMeasures = sortEnumValues(unitOfMeasureOptions);
  selectedFile: File;
  imageSrc: string;
  isEditMode = false;
  hasRecipe = false;
  fileName: string;
  productCategoryTypes = sortEnumValues(productCategoryTypeOptions);
  productCategoryType = ProductCategoryType;
  isGiftCard = false;
  stores: StoreLookupDto[] = [];
  destroy$: Subject<void> = new Subject();
  isInventoryManagedAtCorporateLevel: boolean = false;
  isRecipieManagedAsBundle: boolean = false;
  corporateSettingDto: CorporateSettingDto;

  constructor(
    private productService: ProductService,
    private fb: FormBuilder,
    public route: Router,
    private toaster: ToasterService,
    private corporateSettingService: CorporateSettingService,
  ) {}

  ngOnInit() {
    this.prepareFormData(this.model.id);

    this.corporateSettingService
      .getCorporateSetting()
      .pipe(takeUntil(this.destroy$))
      .subscribe(corporateSettingDto => {
        this.corporateSettingDto = corporateSettingDto;
      });
  }

  prepareFormData(id: string) {
    (id == undefined
      ? this.productService.getProductDtoValues()
      : this.productService.getProductById(id, PictureSizeType.Details)
    ).subscribe({
      next: response => {
        this.model = response;
        this.imageSrc = response.imageSrc;
        this.stores = response.availableStores;
        this.buildForm(this.model);

        this.setupProductCategoryTypeBehavior();
        this.setUpBundleRecipeBehavior();
      },
    });
  }

  setUpBundleRecipeBehavior() {
    this.isInventoryManagedAtCorporateLevel =
      this.corporateSettingDto.inventoryTrackingType === InventoryTrackingType.CorporateLevel;

    this.isRecipieManagedAsBundle =
      this.hasRecipe &&
      this.corporateSettingDto.recipeInventoryManageType ===
        RecipeInventoryManageType.RecipeAsBundleProduct;
  }

  private buildForm(product: ProductDto) {
    this.isEditMode = isGuidNullOrEmpty(product.id) ? false : true;
    this.form = this.fb.group({
      tenantId: [product.tenantId],
      name: [product.name ?? '', Validators.required],
      productCode: [{ value: product.productCode, disabled: this.isEditMode }, Validators.required],
      productTypeValueId: [product.productTypeValueId, Validators.required],
      sku: [product.sku],
      status: [product.status, Validators.required],
      departmentValueId: [product.departmentValueId],
      careCodeValueId: [product.careCodeValueId],
      hasRecipes: [product.hasRecipes],
      binLocation: [product.binLocation],
      description: [product.description, Validators.required],
      storeIds: [product.storeIds],
      purchasedUnitOfMeasure: [product.purchasedUnitOfMeasure],
      purchasedUnitOfMeasureValue: [product.purchasedUnitOfMeasureValue || 0],
      sellingUnitOfMeasure: [product.sellingUnitOfMeasure],
      sellingUnitOfMeasureValue: [product.sellingUnitOfMeasureValue],
      isForceWireServiceEnabled: [product.isForceWireServiceEnabled || false],
      wireServiceId: [
        { value: product.wireServiceId, disabled: !product.isForceWireServiceEnabled },
      ],
      isCommisionable: [product.isCommisionable],
      isNonTaxable: [product.isNonTaxable],
      basePrice: [product.basePrice || 0],
      midPrice: [product.midPrice || 0],
      highPrice: [product.highPrice || 0],
      wireOut: [product.wireOut || 0],
      unitCost: [product.unitCost || 0],
      averageCost: [{ value: 0, disabled: true }],
      isBasePriceOverriden: [product.isBasePriceOverriden || false],
      laborCost: [{ value: product.laborCost || 0, disabled: !product.hasRecipes }],
      isTrackingInventoryEnabled: [product.isTrackingInventoryEnabled],
      onHandQuantity: [product.onHandQuantity],
      onOrderQuantity: [product.onOrderQuantity],
      lowStockQuantiy: [product.lowStockQuantiy],
      commitQuantityLeadTime: [product.commitQuantityLeadTime],
      committed: [{ value: '', disabled: true }],
      isOutOfStockSalesEnabled: [
        { value: product.isOutOfStockSalesEnabled, disabled: !product.isTrackingInventoryEnabled },
      ],
      reOrderLevel: [product.reOrderLevel],
      isSeasonal: [product.isSeasonal],
      isSeasonalPricingEnabled: [
        { value: product.isSeasonalPricingEnabled, disabled: !product.isSeasonal },
      ],
      seasonalPrice: [
        { value: product.seasonalPrice, disabled: !product.isSeasonalPricingEnabled },
      ],
      isSeasonalAvailabilityEnabled: [
        { value: product.isSeasonalAvailabilityEnabled, disabled: !product.isSeasonal },
      ],
      seasonalAvailabilityStartDate: [
        {
          value: product.seasonalAvailabilityStartDate,
          disabled: !product.isSeasonalAvailabilityEnabled,
        },
      ],
      seasonalAvailabilityEndDate: [
        {
          value: product.seasonalAvailabilityEndDate,
          disabled: !product.isSeasonalAvailabilityEnabled,
        },
      ],
      comment: [product.comment],
      hasImage: [false],
      imageUrl: [{ value: '', disabled: true }],
      isAllowPartialStockSale: [product.isAllowPartialStockSale],
      productCategoryType: [product.productCategoryType || ProductCategoryType.Flower],
    });
    this.hasRecipe = product.hasRecipes;
    this.setupFormListeners();
    this.isLoading = false;
    if (this.isInventoryManagedAtCorporateLevel) {
      this.disableControl('storeIds', product.storeIds);
    }
  }

  submitChanges() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }
    const formValue = this.form.getRawValue();
    if (
      (formValue.productCategoryType === ProductCategoryType.Flower ||
        formValue.productCategoryType === ProductCategoryType.AddOn) &&
      formValue.productCode === GIFTCARD_DEFAULT_PRODUCT_CODE
    ) {
      this.toaster.error('::Product.GiftCardCodeError');
      return;
    }

    formValue.seasonalAvailabilityStartDate = moment(
      formValue.seasonalAvailabilityStartDate,
    ).format('YYYY-MM-DD');
    formValue.seasonalAvailabilityEndDate = moment(formValue.seasonalAvailabilityEndDate).format(
      'YYYY-MM-DD',
    );

    this.form.get('productCode').enable();
    this.form.get('name').enable();

    if (this.isEditMode) {
      this.productService.update(this.model.id, formValue).subscribe(response => {
        this.toaster.success('::UpdateSuccess');
        this.componentState(response, true);
      });
    } else {
      this.productService.create(formValue).subscribe({
        next: response => {
          this.toaster.success('::CreateSuccess');
          this.componentState(response, false);
        },
      });
    }
  }

  componentState(res: any, isEdit: boolean) {
    if (this.saveClicked) {
      this.route.navigate(['products']);
      return;
    }
    if (isEdit) {
      let currentUrl = this.route.url;
      this.route.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.route.navigate([currentUrl]);
      });
    } else {
      this.route.navigate(['products/edit', res?.id]);
    }
  }
  onSaveClick() {
    this.saveClicked = true;
    this.submitChanges();
  }
  onSaveAndContinueClick() {
    this.saveClicked = false;
    this.submitChanges();
  }

  setupFormListeners(): void {
    this.form.get('isSeasonal').valueChanges.subscribe(isSeasonal => {
      if (isSeasonal) {
        this.enableControl('isSeasonalPricingEnabled');
        this.enableControl('isSeasonalAvailabilityEnabled');
      } else {
        this.disableControl('isSeasonalPricingEnabled', false);
        this.disableControl('isSeasonalAvailabilityEnabled', false);
        this.disableControl('seasonalPrice', 0);
        this.disableControl('seasonalAvailabilityStartDate');
        this.disableControl('seasonalAvailabilityEndDate');
      }
    });

    this.form.get('isSeasonalPricingEnabled').valueChanges.subscribe(isSeasonalPricingEnabled => {
      if (isSeasonalPricingEnabled) {
        this.enableControl('seasonalPrice');
      } else {
        this.disableControl('seasonalPrice', 0);
      }
    });
    this.form.get('isTrackingInventoryEnabled').valueChanges.subscribe(isSeasonalPricingEnabled => {
      if (isSeasonalPricingEnabled) {
        this.enableControl('isOutOfStockSalesEnabled');
      } else {
        this.disableControl('isOutOfStockSalesEnabled', false);
      }
    });

    this.form
      .get('isSeasonalAvailabilityEnabled')
      .valueChanges.subscribe(isSeasonalAvailabilityEnabled => {
        if (isSeasonalAvailabilityEnabled) {
          this.enableControl('seasonalAvailabilityStartDate');
          this.enableControl('seasonalAvailabilityEndDate');
        } else {
          this.disableControl('seasonalAvailabilityStartDate');
          this.disableControl('seasonalAvailabilityEndDate');
        }
      });
    this.form.get('hasImage')?.valueChanges.subscribe(hasImage => {
      if (hasImage) {
        this.form.get('imageUrl')?.enable();
      } else {
        this.form.get('imageUrl')?.disable();
      }
    });
    this.form.get('isForceWireServiceEnabled').valueChanges.subscribe(isForceWireServiceEnabled => {
      if (isForceWireServiceEnabled) {
        this.enableControl('wireServiceId');
      } else {
        this.disableControl('wireServiceId');
      }
    });
    this.form.get('hasRecipes').valueChanges.subscribe(hasRecipes => {
      if (hasRecipes) {
        this.enableControl('laborCost');
        this.hasRecipe = true;
      } else {
        this.disableControl('laborCost');
        this.hasRecipe = false;
      }
    });
  }

  enableControl(controlName: string): void {
    this.form.get(controlName).enable();
  }

  disableControl(controlName: string, value: any = ''): void {
    const control = this.form.get(controlName);
    control.disable();
    control.setValue(value);
  }

  onFileChange(event) {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];

      const myFormData = new FormData();
      myFormData.append('file', this.selectedFile);
      this.fileName = this.selectedFile.name;
      this.productService.uploadPicture(myFormData, this.model.id).subscribe(() => {
        this.loadFile(this.model.id);
      });
    }
  }

  loadFile(id: string) {
    this.productService.getProductPicture(id, PictureSizeType.Details).subscribe(imageSrc => {
      this.imageSrc = imageSrc;
    });
  }

  removeImage(): void {
    this.productService.removeProductPictures(this.model.id).subscribe(() => {
      this.toaster.success('::Product.ImageRemovedSuccess');
      this.imageSrc = null;
      this.fileName = null;
    });
  }

  setupProductCategoryTypeBehavior() {
    const productCategoryTypeControl = this.form.get('productCategoryType');
    const productCodeControl = this.form.get('productCode');

    if (productCategoryTypeControl && productCodeControl) {
      if (
        !this.isEditMode &&
        productCategoryTypeControl.value === this.productCategoryType.GiftCard
      ) {
        productCodeControl.setValue('GC');
        productCodeControl.disable();
      } else if (
        this.isEditMode &&
        productCategoryTypeControl.value === this.productCategoryType.GiftCard
      ) {
        productCodeControl.disable();
      }

      productCategoryTypeControl.valueChanges.subscribe((value: number) => {
        if (
          (!this.isEditMode && value === this.productCategoryType.GiftCard) ||
          (this.isEditMode && value === this.productCategoryType.GiftCard)
        ) {
          productCodeControl.setValue('GC');
          productCodeControl.disable();
        } else if (
          (this.isEditMode && value !== this.productCategoryType.GiftCard) ||
          (!this.isEditMode && value !== this.productCategoryType.GiftCard)
        ) {
          productCodeControl.setValue('');
          productCodeControl.enable();
        }
      });
    }
  }

  get hasImage() {
    return this.form.get('hasImage');
  }

  get imageUrl() {
    return this.form.get('imageUrl');
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
