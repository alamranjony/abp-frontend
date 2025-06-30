import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeSettingsRoutingModule } from './employee-settings-routing.module';
import { EmployeeSettingsComponent } from './employee-settings.component';
import { SharedModule } from '../shared/shared.module';
import { AngularMaterialModule } from '../shared/angular-material/angular-material.module';

@NgModule({
  declarations: [EmployeeSettingsComponent],
  imports: [SharedModule, AngularMaterialModule, CommonModule, EmployeeSettingsRoutingModule],
})
export class EmployeeSettingsModule {}
