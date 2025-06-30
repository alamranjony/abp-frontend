import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { VehicleRoutingModule } from './vehicle-routing.module';
import { VehicleComponent } from './vehicle.component';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  declarations: [VehicleComponent],
  imports: [SharedModule, VehicleRoutingModule, NgbDatepickerModule],
})
export class VehicleModule {}
