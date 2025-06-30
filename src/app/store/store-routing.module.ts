import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StoreComponent } from './store.component';
import { authGuard, permissionGuard } from '@abp/ng.core';

const routes: Routes = [
  {
    path: '',
    component: StoreComponent,
    children: [{ path: '', component: StoreComponent }],
  },
  {
    path: 'stores',
    component: StoreComponent,
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Stores',
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StoreRoutingModule {}
