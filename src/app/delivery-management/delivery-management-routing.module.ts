import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DeliveryControlComponent } from './delivery-control/delivery-control.component';
import { RoutingComponent } from './routing/routing.component';
import { DriverSummaryComponent } from './driver-summary/driver-summary.component';
import { authGuard, permissionGuard } from '@abp/ng.core';

const routes: Routes = [
  {
    path: '',
    component: DeliveryControlComponent,
    children: [{ path: '', component: DeliveryControlComponent }],
  },
  {
    path: 'delivery-control',
    component: DeliveryControlComponent,
    canActivate: [authGuard, permissionGuard],
    data: { requiredPolicy: 'ClientPortal.DeliveryControl' },
  },
  {
    path: 'routing',
    component: RoutingComponent,
    canActivate: [authGuard, permissionGuard],
    data: { requiredPolicy: 'ClientPortal.DeliveryRoutes' },
  },
  {
    path: 'driver-summary',
    component: DriverSummaryComponent,
    canActivate: [authGuard, permissionGuard],
    data: { requiredPolicy: 'ClientPortal.DeliveryRoutes' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DeliveryManagementRoutingModule {}
