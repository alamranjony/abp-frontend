import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductListComponent } from './product-list/product-list.component';
import { ProductAddEditComponent } from './product-add-edit/product-add-edit.component';
import { authGuard, permissionGuard } from '@abp/ng.core';

const routes: Routes = [
  { path: '', component: ProductListComponent },
  {
    path: 'create',
    component: ProductAddEditComponent,
    canActivate: [authGuard, permissionGuard],
    data: { requiredPolicy: 'ClientPortal.Products.CreateAndEdit' },
  },
  {
    path: 'edit/:id',
    component: ProductAddEditComponent,
    canActivate: [authGuard, permissionGuard],
    data: { requiredPolicy: 'ClientPortal.Products.CreateAndEdit' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProductsRoutingModule {}
