import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SmsHistoryRoutingModule } from './sms-history-routing.module';
import { SmsHistoryComponent } from './sms-history.component';
import { SharedModule } from '../shared/shared.module';
import { AngularMaterialModule } from '../shared/angular-material/angular-material.module';

@NgModule({
  declarations: [SmsHistoryComponent],
  imports: [CommonModule, SharedModule, AngularMaterialModule, SmsHistoryRoutingModule],
})
export class SmsHistoryModule {}
