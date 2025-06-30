import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeClockRoutingModule } from './time-clock-routing.module';
import { TimeClockComponent } from './time-clock.component';
import { SharedModule } from '../shared/shared.module';
import { TopBarTimeClockComponent } from './top-bar-time-clock/top-bar-time-clock.component';

@NgModule({
  declarations: [TimeClockComponent, TopBarTimeClockComponent],
  imports: [CommonModule, SharedModule, TimeClockRoutingModule],
})
export class TimeClockModule {}
