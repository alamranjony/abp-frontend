import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { MatDialogModule } from '@angular/material/dialog';
import { DeliveryModeRoutingModule } from './delivery-mode-routing.module';
import { DeliveryModeComponent } from './delivery-mode.component';
import { DeliveryModeDialogComponent } from './delivery-mode-dialog/delivery-mode-dialog.component';
import { AngularMaterialModule } from '../shared/angular-material/angular-material.module';

@NgModule({
  declarations: [DeliveryModeComponent, DeliveryModeDialogComponent],
  imports: [SharedModule, DeliveryModeRoutingModule, AngularMaterialModule, MatDialogModule],
})
export class DeliveryModeModule {}
