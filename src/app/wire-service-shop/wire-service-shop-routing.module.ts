import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WireServiceShopComponent } from './wire-service-shop.component';
import { authGuard, permissionGuard } from '@abp/ng.core';

const routes: Routes = [
  {
    path: '',
    component: WireServiceShopComponent,
    canActivate: [authGuard, permissionGuard],
    data: { requiredPolicy: 'ClientPortal.WireServiceShops' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WireServiceShopRoutingModule {}
