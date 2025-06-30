import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShippingServiceRoutingModule } from './shipping-service-routing.module';
import { ShippingServiceComponent } from './shipping-service.component';
import { AngularMaterialModule } from '../shared/angular-material/angular-material.module';
import { SharedModule } from '../shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';
import { SearchComponent } from '../shared/components/search/search.component';

@NgModule({
  declarations: [ShippingServiceComponent],
  imports: [
    AngularMaterialModule,
    SharedModule,
    CommonModule,
    ShippingServiceRoutingModule,
    ReactiveFormsModule,
    SearchComponent,
  ],
})
export class ShippingServiceModule {}
