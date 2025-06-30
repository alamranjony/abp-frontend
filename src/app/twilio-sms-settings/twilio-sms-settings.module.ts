import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TwilioSmsSettingsRoutingModule } from './twilio-sms-settings-routing.module';
import { TwilioSmsSettingsComponent } from './twilio-sms-settings.component';
import { SharedModule } from '../shared/shared.module';
import { AngularMaterialModule } from '../shared/angular-material/angular-material.module';
import { SmsSendDialogComponent } from './sms-send-dialog/sms-send-dialog.component';

@NgModule({
  declarations: [TwilioSmsSettingsComponent, SmsSendDialogComponent],
  imports: [CommonModule, SharedModule, AngularMaterialModule, TwilioSmsSettingsRoutingModule],
})
export class TwilioSmsSettingsModule {}
