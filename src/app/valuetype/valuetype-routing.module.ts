import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ValuetypeComponent } from './valuetype.component';
import { ValueTypeDetailsListComponent } from './value-type-details-list/value-type-details-list.component';
import { ValueTypeListComponent } from './value-type-list/value-type-list.component';
import { authGuard, permissionGuard } from '@abp/ng.core';

const routes: Routes = [
  {
    path: '',
    component: ValuetypeComponent,
    children: [
      {
        path: '',
        component: ValueTypeListComponent,
      },
      {
        path: 'valuelist/:id',
        component: ValueTypeDetailsListComponent,
        canActivate: [authGuard, permissionGuard],
        data: { requiredPolicy: 'ClientPortal.Values' },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ValuetypeRoutingModule {}
