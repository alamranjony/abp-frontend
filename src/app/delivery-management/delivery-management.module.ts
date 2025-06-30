import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeliveryManagementRoutingModule } from './delivery-management-routing.module';
import { DeliveryControlComponent } from './delivery-control/delivery-control.component';
import { RoutingComponent } from './routing/routing.component';
import { DriverSummaryComponent } from './driver-summary/driver-summary.component';
import { SharedModule } from '../shared/shared.module';
import { DeliveryControlEditSlotDialogComponent } from './delivery-control-edit-slot-dialog/delivery-control-edit-slot-dialog.component';
import { DeliveryControlBulkDateChangeComponent } from './delivery-control-bulk-date-change/delivery-control-bulk-date-change.component';
import { DeliveryControlEditIndividualSlotDialogComponent } from './delivery-control-edit-individual-slot-dialog/delivery-control-edit-individual-slot-dialog.component';
import { DeliveryControlRouteCreationDialogComponent } from './delivery-control-route-creation-dialog/delivery-control-route-creation-dialog.component';
import { DeliveryControlCreateRouteMapComponent } from './delivery-control-create-route-map/delivery-control-create-route-map.component';
import { DragDropModule } from '@angular/cdk/drag-drop';

@NgModule({
  declarations: [
    DeliveryControlComponent,
    RoutingComponent,
    DriverSummaryComponent,
    DeliveryControlEditSlotDialogComponent,
    DeliveryControlBulkDateChangeComponent,
    DeliveryControlEditIndividualSlotDialogComponent,
    DeliveryControlRouteCreationDialogComponent,
    DeliveryControlCreateRouteMapComponent,
  ],
  imports: [SharedModule, CommonModule, DeliveryManagementRoutingModule, DragDropModule],
})
export class DeliveryManagementModule {}
