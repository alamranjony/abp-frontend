import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomerListComponent } from './customer-list/customer-list.component';
import { CustomerFormComponent } from './customer-form/customer-form.component';
import { CustomerCommentComponent } from '../customer-comment/customer-comment.component';
import { CustomerOrderHistoryComponent } from './customer-order-history/customer-order-history.component';
import { CustomerBalanceDetailsComponent } from './customer-balance-details/customer-balance-details.component';
import { authGuard, permissionGuard } from '@abp/ng.core';

const routes: Routes = [
  {
    path: '',
    component: CustomerListComponent,
    children: [{ path: '', component: CustomerListComponent }],
  },
  {
    path: 'customers',
    component: CustomerListComponent,
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Customers.View',
    },
  },
  {
    path: 'create',
    component: CustomerFormComponent,
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Customers.CreateAndEdit',
    },
  },
  {
    path: 'edit/:id',
    component: CustomerFormComponent,
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Customers.CreateAndEdit',
    },
  },
  {
    path: ':id/comments',
    component: CustomerCommentComponent,
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Customers.CustomerComments',
    },
  },
  {
    path: 'balance-details/:id',
    component: CustomerBalanceDetailsComponent,
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Customers.BalanceDetails',
    },
  },
  {
    path: 'customer-order-history/:id',
    component: CustomerOrderHistoryComponent,
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Customers.OrderHistory',
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CustomersRoutingModule {}
