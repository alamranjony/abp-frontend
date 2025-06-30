import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeliveryMapOptionSettingRoutingModule } from './delivery-map-option-setting-routing.module';
import { DeliveryMapOptionSettingComponent } from './delivery-map-option-setting.component';
import { SharedModule } from '../shared/shared.module';
import { AngularMaterialModule } from '../shared/angular-material/angular-material.module';

@NgModule({
  declarations: [DeliveryMapOptionSettingComponent],
  imports: [
    CommonModule,
    SharedModule,
    DeliveryMapOptionSettingRoutingModule,
    AngularMaterialModule,
  ],
})
export class DeliveryMapOptionSettingModule {}
