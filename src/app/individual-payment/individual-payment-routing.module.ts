import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IndividualPaymentWrapperComponent } from './individual-payment-wrapper.component';
import { IndividualPaymentListComponent } from './individual-payment-list/individual-payment-list.component';
import { AddUpdateIndividualPaymentComponent } from './add-update-individual-payment/add-update-individual-payment.component';
import { authGuard, permissionGuard } from '@abp/ng.core';

const routes: Routes = [
  {
    path: '',
    component: IndividualPaymentWrapperComponent,
    children: [
      { path: '', component: IndividualPaymentListComponent, pathMatch: 'full' },
      {
        path: 'create',
        component: AddUpdateIndividualPaymentComponent,
        pathMatch: 'full',
        canActivate: [authGuard, permissionGuard],
        data: { requiredPolicy: 'ClientPortal.SinglePayment.CreateAndEdit' },
      },
      {
        path: 'edit/:id',
        component: AddUpdateIndividualPaymentComponent,
        pathMatch: 'full',
        canActivate: [authGuard, permissionGuard],
        data: { requiredPolicy: 'ClientPortal.SinglePayment.CreateAndEdit' },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class IndividualPaymentRoutingModule {}
