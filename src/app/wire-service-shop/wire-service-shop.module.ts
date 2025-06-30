import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { WireServiceShopRoutingModule } from './wire-service-shop-routing.module';
import { WireServiceShopComponent } from './wire-service-shop.component';

@NgModule({
  declarations: [
    WireServiceShopComponent
  ],
  imports: [
    WireServiceShopRoutingModule,
    SharedModule
  ]
})
export class WireServiceShopModule { }
