import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditLogsRoutingModule } from './audit-logs-routing.module';
import { AuditLogsComponent } from './audit-logs.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [AuditLogsComponent],
  imports: [SharedModule, CommonModule, AuditLogsRoutingModule],
})
export class AuditLogsModule {}
