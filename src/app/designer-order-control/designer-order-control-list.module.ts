import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { AngularMaterialModule } from '../shared/angular-material/angular-material.module';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DesignerOrderControlListComponent } from './designer-order-control-list.component';
import { ChangeEmployeeDialogComponent } from './change-employee-dialog/change-employee-dialog.component';
import { DesignerOrderDetailsComponent } from './designer-order-details/designer-order-details.component';
import { authGuard, permissionGuard } from '@abp/ng.core';

const routes: Routes = [
  { path: '', component: DesignerOrderControlListComponent },
  {
    path: 'designer-order-details/:id',
    component: DesignerOrderDetailsComponent,
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Design.UpdateOrderDetails',
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
  ],
  declarations: [DesignerOrderControlListComponent, ChangeEmployeeDialogComponent],
})
export class DesignerOrderControlListModule {}
