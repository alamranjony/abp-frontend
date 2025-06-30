import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CorporateSettingsComponent } from './corporate-settings.component';
import { authGuard, permissionGuard } from '@abp/ng.core';

const routes: Routes = [
  {
    path: '',
    component: CorporateSettingsComponent,
    canActivate: [authGuard, permissionGuard],
    data: { requiredPolicy: 'ClientPortal.CorporateSettings' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CorporateSettingsRoutingModule {}
