import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { DeliverySlotRoutingModule } from './delivery-slot-routing.module';
import { DeliverySlotComponent } from './delivery-slot.component';
import { DeliverySlotDialogComponent } from './delivery-slot-dialog/delivery-slot-dialog.component';
import { AngularMaterialModule } from '../shared/angular-material/angular-material.module';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';

@NgModule({
  declarations: [DeliverySlotComponent, DeliverySlotDialogComponent],
  imports: [
    SharedModule,
    DeliverySlotRoutingModule,
    AngularMaterialModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDialogModule,
  ],
  exports: [DeliverySlotComponent],
})
export class DeliverySlotModule {}
