import { ToasterService } from '@abp/ng.theme.shared';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CreateUpdateProductRecipeDto } from '@proxy/product-recipes';
import { ProductDto, ProductLookupDto, ProductService } from '@proxy/products';
import { debounceTime, distinctUntilChanged, map, Observable, switchMap } from 'rxjs';
import { DEBOUNCE_TIME } from 'src/app/shared/constants';

@Component({
  selector: 'app-existing-recipe-dialog',
  templateUrl: './existing-recipe-dialog.component.html',
  styleUrls: ['./existing-recipe-dialog.component.scss'],
})
export class ExistingRecipeDialogComponent {
  form: FormGroup;
  filteredOptions$: Observable<ProductLookupDto[]>;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ExistingRecipeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CreateUpdateProductRecipeDto,
    private productService: ProductService,
    private toaster: ToasterService,
  ) {
    this.form = this.fb.group({
      productId: [data.productId, Validators.required],
      productCode: ['', Validators.required],
    });

    this.filteredOptions$ = this.form.controls['productCode'].valueChanges.pipe(
      debounceTime(DEBOUNCE_TIME),
      distinctUntilChanged(),
      switchMap(value => this.fetchAndValidateOptions(value)), // Combined fetch and validate
    );
  }

  fetchAndValidateOptions(value: string): Observable<ProductLookupDto[]> {
    return this.productService.getAutoCompleteList(value, true).pipe(
      map(response => {
        const options = response.items || [];
        const validProduct = options.find(option => option.productCode === value);
        if (!validProduct) {
          this.form.controls['productCode'].setErrors({ invalidOption: true });
        } else {
          this.form.controls['productCode'].setErrors(null); // Clear errors if valid
          this.form.patchValue({ productId: validProduct.id });
        }
        return options;
      }),
    );
  }

  onOptionSelected(event: any): void {
    const selectedProductCode = event.option.value;
    const selectedProduct = (this.filteredOptions$ as any).value?.find(
      (option: ProductDto) => option.productCode === selectedProductCode,
    );

    if (selectedProduct) {
      this.form.patchValue({
        productId: selectedProduct.id,
      });
    }
  }

  onSave(): void {
    if (this.form.valid) {
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
