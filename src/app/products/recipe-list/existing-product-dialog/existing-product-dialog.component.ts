import { ToasterService } from '@abp/ng.theme.shared';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CreateUpdateProductRecipeDto } from '@proxy/product-recipes';
import { ProductDto, ProductLookupDto, ProductService } from '@proxy/products';
import { debounceTime, distinctUntilChanged, map, Observable, switchMap } from 'rxjs';
import { DEBOUNCE_TIME } from 'src/app/shared/constants';

@Component({
  selector: 'app-existing-product-dialog',
  templateUrl: './existing-product-dialog.component.html',
  styleUrls: ['./existing-product-dialog.component.scss'],
})
export class ExistingProductDialogComponent {
  form: FormGroup;
  filteredOptions$: Observable<ProductLookupDto[]>;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ExistingProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CreateUpdateProductRecipeDto,
    private productService: ProductService,
    private toaster: ToasterService,
  ) {
    this.form = this.fb.group({
      tenantId: [data.tenantId],
      masterProductId: [data.masterProductId],
      productId: [data.productId, Validators.required],
      basePrice: [{ value: data.basePrice, disabled: true }, Validators.required],
      quantity: [data.quantity, Validators.required],
      totalPrice: [{ value: data.totalPrice, disabled: true }],
      productCode: ['', Validators.required],
      comments: [data.comments],
    });

    this.filteredOptions$ = this.form.controls['productCode'].valueChanges.pipe(
      debounceTime(DEBOUNCE_TIME),
      distinctUntilChanged(),
      switchMap(value => this.fetchAndValidateOptions(value)),
    );

    this.form.get('basePrice').valueChanges.subscribe(() => {
      this.calculateTotalPrice();
    });

    this.form.get('quantity').valueChanges.subscribe(() => {
      this.calculateTotalPrice();
    });
  }

  fetchAndValidateOptions(value: string): Observable<ProductLookupDto[]> {
    return this.productService.getAutoCompleteList(value).pipe(
      map(response => {
        const options = response.items || [];
        const validProduct = options.find(option => option.productCode === value);
        if (!validProduct) {
          this.form.controls['productCode'].setErrors({ invalidOption: true });
          this.form.patchValue({
            productId: null,
            basePrice: 0,
            productCode: null,
          });
        } else {
          this.form.controls['productCode'].setErrors(null);
          this.form.controls['basePrice'].setErrors(null);
          this.form.patchValue({ productId: validProduct.id });
          this.form.patchValue({ basePrice: validProduct.basePrice });
          this.form.patchValue({
            productId: validProduct.id,
            basePrice: validProduct.basePrice,
          });
        }
        return options;
      }),
    );
  }

  calculateTotalPrice(): void {
    const basePrice = this.form.get('basePrice').value || 0;
    const quantity = this.form.get('quantity').value || 0;
    const totalPrice = basePrice * quantity;
    this.form.get('totalPrice').setValue(totalPrice, { emitEvent: false });
  }

  onSave(): void {
    if (this.form.valid) {
      this.form.get('basePrice').enable();
      this.form.get('totalPrice').enable();
      this.dialogRef.close(this.form.value);
    } else {
      this.form.markAllAsTouched();
      this.toaster.error('::ValidationError:InvalidFormOrData');
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
