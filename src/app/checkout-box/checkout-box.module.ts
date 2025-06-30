import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CheckoutBoxComponent } from './checkout-box.component';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { AngularMaterialModule } from '../shared/angular-material/angular-material.module';
import { CheckoutBoxDetailsComponent } from './checkout-box-details/checkout-box-details.component';
import { authGuard, permissionGuard } from '@abp/ng.core';

const routes: Routes = [
  { path: '', component: CheckoutBoxComponent },
  {
    path: 'details',
    component: CheckoutBoxDetailsComponent,
    canActivate: [authGuard, permissionGuard],
    data: { requiredPolicy: 'ClientPortal.CheckoutBox' },
  },
];

@NgModule({
  declarations: [CheckoutBoxComponent],
  imports: [RouterModule.forChild(routes), CommonModule, SharedModule, AngularMaterialModule],
})
export class CheckoutBoxModule {}
