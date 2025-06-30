import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderControlListComponent } from './order-control-list.component';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { AngularMaterialModule } from '../shared/angular-material/angular-material.module';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { OrderDetailsComponent } from './order-details/order-details.component';
import { OrderReplacementReasonDialogComponent } from './order-details/order-replacement-reason-dialog/order-replacement-reason-dialog.component';
import { authGuard, permissionGuard } from '@abp/ng.core';

const routes: Routes = [
  { path: '', component: OrderControlListComponent },
  {
    path: 'order-details/:id',
    component: OrderDetailsComponent,
    canActivate: [authGuard, permissionGuard],
    data: { requiredPolicy: 'ClientPortal.Orders.OrderDetails' },
  },
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    SharedModule,
    AngularMaterialModule,
    MatRadioModule,
    MatFormFieldModule,
  ],
  declarations: [OrderControlListComponent, OrderReplacementReasonDialogComponent],
})
export class OrderControlListModule {}
