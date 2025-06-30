import { NgModule } from '@angular/core';
import { AccountSettingsRoutingModule } from './account-settings-routing.module';
import { AccountSettingsComponent } from './account-settings.component';
import { SharedModule } from '../shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [AccountSettingsComponent],
  imports: [SharedModule, AccountSettingsRoutingModule, ReactiveFormsModule],
})
export class AccountSettingsModule {}
