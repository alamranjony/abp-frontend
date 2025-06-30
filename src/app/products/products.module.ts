import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductsRoutingModule } from './products-routing.module';
import { SharedModule } from '../shared/shared.module';
import { ProductListComponent } from './product-list/product-list.component';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { ProductAddEditComponent } from './product-add-edit/product-add-edit.component';
import { ProductAddEditFormComponent } from './product-add-edit-form/product-add-edit-form.component';
import { ImportProductComponent } from './import-product-data/import-product-data.component';
import { RecipeListComponent } from './recipe-list/recipe-list.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ExistingProductDialogComponent } from './recipe-list/existing-product-dialog/existing-product-dialog.component';
import { ExistingRecipeDialogComponent } from './recipe-list/existing-recipe-dialog/existing-recipe-dialog.component';
import { SearchComponent } from '../shared/components/search/search.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BackButtonComponent } from '../shared/components/back-button/back-button.component';
import { ProductStockComponent } from './product-stock/product-stock.component';

@NgModule({
  declarations: [
    ProductListComponent,
    ProductAddEditComponent,
    ProductAddEditFormComponent,
    ImportProductComponent,
    RecipeListComponent,
    ExistingProductDialogComponent,
    ExistingRecipeDialogComponent,
    ProductStockComponent,
  ],
  imports: [
    CommonModule,
    ProductsRoutingModule,
    SharedModule,
    SearchComponent,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    BackButtonComponent,
  ],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
  ],
})
export class ProductsModule {}
