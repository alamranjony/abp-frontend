import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiscountsComponent } from './discounts.component';
import { Routes, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../shared/angular-material/angular-material.module';
import { SharedModule } from '../shared/shared.module';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DiscountsCreateUpdateComponent } from './discount-create-update/discounts-create-update.component';
import { BackButtonComponent } from '../shared/components/back-button/back-button.component';
import { authGuard, permissionGuard } from '@abp/ng.core';

const routes: Routes = [
  { path: '', component: DiscountsComponent },
  {
    path: 'create',
    component: DiscountsCreateUpdateComponent,
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Discounts.CreateAndEdit',
    },
  },
  {
    path: 'edit/:discountId',
    component: DiscountsCreateUpdateComponent,
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Discounts.CreateAndEdit',
    },
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
    BackButtonComponent,
  ],
  declarations: [DiscountsComponent, DiscountsCreateUpdateComponent],
})
export class DiscountsModule {}
