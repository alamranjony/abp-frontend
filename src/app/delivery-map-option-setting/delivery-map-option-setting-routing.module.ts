import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DeliveryMapOptionSettingComponent } from './delivery-map-option-setting.component';

const routes: Routes = [{ path: '', component: DeliveryMapOptionSettingComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DeliveryMapOptionSettingRoutingModule {}
