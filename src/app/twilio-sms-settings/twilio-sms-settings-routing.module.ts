import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TwilioSmsSettingsComponent } from './twilio-sms-settings.component';

const routes: Routes = [{ path: '', component: TwilioSmsSettingsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TwilioSmsSettingsRoutingModule {}
