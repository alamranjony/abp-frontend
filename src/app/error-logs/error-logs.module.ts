import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorLogsRoutingModule } from './error-logs-routing.module';
import { ErrorLogsComponent } from './error-logs.component';
import { SharedModule } from '../shared/shared.module';
import { AngularMaterialModule } from '../shared/angular-material/angular-material.module';

@NgModule({
  declarations: [ErrorLogsComponent],
  imports: [AngularMaterialModule, SharedModule, CommonModule, ErrorLogsRoutingModule],
})
export class ErrorLogsModule {}
