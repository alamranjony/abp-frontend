import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DriverActivityRoutingModule } from './driver-activity-routing.module';
import { DriverCheckOutComponent } from './driver-check-out/driver-check-out.component';
import { DriverCheckInComponent } from './driver-check-in/driver-check-in.component';
import { SharedModule } from '../shared/shared.module';


@NgModule({
  declarations: [
    DriverCheckOutComponent,
    DriverCheckInComponent
  ],
  imports: [
    SharedModule,
    CommonModule,
    DriverActivityRoutingModule
  ]
})
export class DriverActivityModule { }
