import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DeliveryChargeAdjustmentSettingsComponent } from './delivery-charge-adjustment-settings.component';

const routes: Routes = [{ path: '', component: DeliveryChargeAdjustmentSettingsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DeliveryChargeAdjustmentSettingsRoutingModule { }
