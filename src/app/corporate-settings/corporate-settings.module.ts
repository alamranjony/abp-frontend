import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CorporateSettingsRoutingModule } from './corporate-settings-routing.module';
import { CorporateSettingsComponent } from './corporate-settings.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [CorporateSettingsComponent],
  imports: [SharedModule, CommonModule, CorporateSettingsRoutingModule],
})
export class CorporateSettingsModule {}
