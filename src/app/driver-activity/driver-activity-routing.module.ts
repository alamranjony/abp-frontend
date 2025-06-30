import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DriverCheckOutComponent } from './driver-check-out/driver-check-out.component';
import { DriverCheckInComponent } from './driver-check-in/driver-check-in.component';
import { authGuard, permissionGuard } from '@abp/ng.core';

const routes: Routes = [
  { path: '', component: DriverCheckOutComponent },
  {
    path: 'driver-check-out',
    component: DriverCheckOutComponent,
    canActivate: [authGuard, permissionGuard],
    data: { requiredPolicy: 'ClientPortal.DriversActivity.CheckOut' },
  },
  {
    path: 'driver-check-in',
    component: DriverCheckInComponent,
    canActivate: [authGuard, permissionGuard],
    data: { requiredPolicy: 'ClientPortal.DriversActivity.CheckIn' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DriverActivityRoutingModule {}
