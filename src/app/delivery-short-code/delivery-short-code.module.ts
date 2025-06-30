import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeliveryShortCodeRoutingModule } from './delivery-short-code-routing.module';
import { DeliveryShortCodeComponent } from './delivery-short-code.component';
import { AngularMaterialModule } from '../shared/angular-material/angular-material.module';
import { SharedModule } from '../shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [DeliveryShortCodeComponent],
  imports: [
    AngularMaterialModule,
    SharedModule,
    CommonModule,
    DeliveryShortCodeRoutingModule,
    ReactiveFormsModule,
  ],
})
export class DeliveryShortCodeModule {}
