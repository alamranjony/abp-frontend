import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeliveryZoneRoutingModule } from './delivery-zone-routing.module';
import { DeliveryZoneComponent } from './delivery-zone.component';
import { SharedModule } from '../shared/shared.module';
import { AngularMaterialModule } from '../shared/angular-material/angular-material.module';
import { MapComponent } from '../map/map.component';
import { AddZoneMapComponent } from '../map/add-zone-map/add-zone-map.component';
import { AddDeliveryZoneComponent } from './add-delivery-zone/add-delivery-zone.component';
import { BackButtonComponent } from '../shared/components/back-button/back-button.component';
import { ImportDeliveryZoneComponent } from './import-delivery-zone/import-delivery-zone.component';

@NgModule({
  declarations: [
    DeliveryZoneComponent,
    MapComponent,
    AddZoneMapComponent,
    AddDeliveryZoneComponent,
    ImportDeliveryZoneComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    AngularMaterialModule,
    DeliveryZoneRoutingModule,
    BackButtonComponent,
  ],
})
export class DeliveryZoneModule {}
