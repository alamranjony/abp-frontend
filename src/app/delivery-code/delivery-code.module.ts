import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeliveryCodeRoutingModule } from './delivery-code-routing.module';
import { DeliveryCodeComponent } from './delivery-code.component';
import { SharedModule } from '../shared/shared.module';
import { AngularMaterialModule } from '../shared/angular-material/angular-material.module';
import { SearchComponent } from '../shared/components/search/search.component';

@NgModule({
  declarations: [DeliveryCodeComponent],
  imports: [
    AngularMaterialModule,
    CommonModule,
    DeliveryCodeRoutingModule,
    SharedModule,
    SearchComponent,
  ],
})
export class DeliveryCodeModule {}
