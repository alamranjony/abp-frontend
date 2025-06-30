import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { ListService, PagedResultDto } from '@abp/ng.core';
import { ConfirmationService, Confirmation, ToasterService } from '@abp/ng.theme.shared';
import { Router } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductRecipeDto, ProductRecipeService } from '@proxy/product-recipes';
import { MatDialog } from '@angular/material/dialog';
import { ExistingProductDialogComponent } from './existing-product-dialog/existing-product-dialog.component';
import { ExistingRecipeDialogComponent } from './existing-recipe-dialog/existing-recipe-dialog.component';

@Component({
  selector: 'app-recipe-list',
  templateUrl: './recipe-list.component.html',
  styleUrls: ['./recipe-list.component.scss'],
  providers: [ListService],
})
export class RecipeListComponent implements OnInit {
  @Input() entityId: string;
  @Input() laborCost: number;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['laborCost']) {
      this.bindTotalCost();
    }
  }

  editRowId: string | null = null;
  productRecipes = { items: [], totalCount: 0 } as PagedResultDto<ProductRecipeDto>;
  columns: string[] = [
    'productCode',
    'description',
    'basePrice',
    'quantity',
    'totalPrice',
    'comments',
    'actions',
  ];
  isModalOpen = false;
  rowFormGroup: FormGroup[] = [];
  totalCost = 0;
  recipeTotal = 0;

  constructor(
    public readonly list: ListService,
    private fb: FormBuilder,
    private productRecipeService: ProductRecipeService,
    private confirmation: ConfirmationService,
    public router: Router,
    private dialog: MatDialog,
    private toasterService: ToasterService,
  ) {}

  ngOnInit(): void {
    const recipeStreamCreator = query =>
      this.productRecipeService.getList({
        ...query,
        productId: this.entityId,
      });

    this.list.hookToQuery(recipeStreamCreator).subscribe(response => {
      this.productRecipes = response;
      this.rowFormGroup = this.productRecipes.items.map(item => {
        this.recipeTotal += item.totalPrice;

        return this.fb.group({
          basePrice: [item.basePrice, Validators.required],
          quantity: [item.quantity, Validators.required],
          comments: [item.comments],
          totalPrice: [{ value: item.basePrice * item.quantity, disabled: true }],
        });
      });

      this.rowFormGroup.forEach((formGroup, index) => {
        formGroup.get('quantity')?.valueChanges.subscribe(() => this.calculateTotal(index));
      });
      this.bindTotalCost();
    });
  }

  calculateTotal(index: number) {
    const basePrice = this.rowFormGroup[index].get('basePrice')?.value || 0;
    const quantity = this.rowFormGroup[index].get('quantity')?.value || 0;
    this.rowFormGroup[index].get('totalPrice')?.setValue(basePrice * quantity);
  }

  startEdit(element: ProductRecipeDto): void {
    this.editRowId = element.id;
    const index = this.productRecipes.items.findIndex(item => item.id === this.editRowId);
    if (index > -1) {
      this.rowFormGroup[index].patchValue({
        basePrice: element.basePrice,
        quantity: element.quantity,
        comments: element.comments,
      });
    }
  }

  saveEdit(row: ProductRecipeDto): void {
    const index = this.productRecipes.items.findIndex(item => item.id === this.editRowId);

    if (index > -1) {
      const formGroup = this.rowFormGroup[index];
      if (formGroup.valid) {
        const editedElement = formGroup.value;

        this.productRecipes.items[index].basePrice = editedElement.basePrice;
        this.productRecipes.items[index].quantity = editedElement.quantity;
        this.productRecipes.items[index].comments = editedElement.comments;
        this.productRecipes.items[index].totalPrice =
          editedElement.basePrice * editedElement.quantity;

        this.productRecipeService
          .update(this.productRecipes.items[index].id, this.productRecipes.items[index])
          .subscribe({
            next: () => {
              this.recipeTotal = 0;
              this.list.get();
              this.toasterService.success('::Recipe.UpdatedSuccess');
            },
            error: () => {
              this.toasterService.error('::ErrorOccurred');
            },
          });
        this.editRowId = null;
      } else {
        formGroup.markAllAsTouched();
      }
    }
  }

  cancelEdit(): void {
    this.editRowId = null;
  }

  changePage(pageEvent: PageEvent) {
    this.list.page = pageEvent.pageIndex;
  }

  changeSort(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
  }

  addExistingProduct() {
    const dialogRef = this.dialog.open(ExistingProductDialogComponent, {
      width: '50%',
      data: { masterProductId: this.entityId },
      enterAnimationDuration: 250,
      exitAnimationDuration: 250,
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.productRecipeService.create(result).subscribe({
          next: () => {
            this.recipeTotal = 0;
            this.list.get();
            this.toasterService.success('::Recipe.AddedSuccess');
          },
          error: () => {
            this.toasterService.error('::ErrorOccurred');
          },
        });
      }
    });
  }

  addExistingRecipe() {
    const dialogRef = this.dialog.open(ExistingRecipeDialogComponent, {
      width: '40%',
      data: { masterProductId: this.entityId },
      enterAnimationDuration: 250,
      exitAnimationDuration: 250,
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.productId) {
        this.productRecipeService.addExistingRecipe(this.entityId, result.productId).subscribe({
          next: response => {
            this.recipeTotal = 0;
            this.list.get();
            if (response > 0) this.toasterService.success('::Recipe.AddedSuccess');
            else this.toasterService.success('::Recipe.NoProductAdded');
          },
          error: () => {
            this.toasterService.error('::ErrorOccurred');
          },
        });
      }
    });
  }

  delete(id: string) {
    this.confirmation.warn('::AreYouSureToDelete', '::AreYouSure').subscribe(status => {
      if (status === Confirmation.Status.confirm) {
        this.productRecipeService.delete(id).subscribe(() => {
          this.recipeTotal = 0;
          this.list.get();
        });
      }
    });
  }

  bindTotalCost() {
    if (this.laborCost > 0) {
      this.totalCost = this.recipeTotal + (this.recipeTotal * this.laborCost) / 100;
    } else {
      this.totalCost = this.recipeTotal;
    }
  }
}
