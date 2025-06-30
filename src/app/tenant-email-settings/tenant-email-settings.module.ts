import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenantEmailSettingsComponent } from './tenant-email-settings.component';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { AngularMaterialModule } from '../shared/angular-material/angular-material.module';

const routes: Routes = [{ path: '', component: TenantEmailSettingsComponent }];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes), SharedModule, AngularMaterialModule],
  declarations: [TenantEmailSettingsComponent],
})
export class TenantEmailSettingsModule {}
