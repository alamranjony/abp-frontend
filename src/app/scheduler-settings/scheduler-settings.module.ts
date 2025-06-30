import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SchedulerSettingsRoutingModule } from './scheduler-settings-routing.module';
import { SchedulerSettingsComponent } from './scheduler-settings.component';
import { SharedModule } from '../shared/shared.module';
import { AngularMaterialModule } from '../shared/angular-material/angular-material.module';

@NgModule({
  declarations: [SchedulerSettingsComponent],
  imports: [CommonModule, SharedModule, AngularMaterialModule, SchedulerSettingsRoutingModule],
})
export class SchedulerSettingsModule {}
