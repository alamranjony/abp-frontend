import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DeliveryZoneComponent } from './delivery-zone.component';
import { AddDeliveryZoneComponent } from './add-delivery-zone/add-delivery-zone.component';
import { authGuard, permissionGuard } from '@abp/ng.core';

const routes: Routes = [
  {
    path: '',
    component: DeliveryZoneComponent,
  },
  {
    path: 'create',
    component: AddDeliveryZoneComponent,
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.DeliveryZones.CreateAndEdit',
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DeliveryZoneRoutingModule {}
