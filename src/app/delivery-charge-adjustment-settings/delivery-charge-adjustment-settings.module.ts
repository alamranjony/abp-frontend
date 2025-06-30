import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeliveryChargeAdjustmentSettingsRoutingModule } from './delivery-charge-adjustment-settings-routing.module';
import { DeliveryChargeAdjustmentSettingsComponent } from './delivery-charge-adjustment-settings.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [DeliveryChargeAdjustmentSettingsComponent],
  imports: [CommonModule, SharedModule, DeliveryChargeAdjustmentSettingsRoutingModule],
})
export class DeliveryChargeAdjustmentSettingsModule {}
