import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreditCardSettingsRoutingModule } from './credit-card-settings-routing.module';
import { CreditCardSettingsComponent } from './credit-card-settings.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [CreditCardSettingsComponent],
  imports: [SharedModule, CommonModule, CreditCardSettingsRoutingModule],
})
export class CreditCardSettingsModule {}
