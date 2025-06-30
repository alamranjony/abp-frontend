import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ShopComponent } from './shop.component';
import { ShopCreateUpdateComponentComponent } from './shop-create-update-component/shop-create-update-component.component';
import { authGuard, permissionGuard } from '@abp/ng.core';

const routes: Routes = [
  { path: '', component: ShopComponent },
  {
    path: 'create',
    component: ShopCreateUpdateComponentComponent,
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Shops.CreateAndEdit',
    },
  },
  {
    path: 'edit/:shopId',
    component: ShopCreateUpdateComponentComponent,
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Shops.CreateAndEdit',
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ShopRoutingModule {}
