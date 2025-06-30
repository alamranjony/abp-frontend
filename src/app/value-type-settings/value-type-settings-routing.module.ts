import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ValueTypeSettingsComponent } from './value-type-settings.component';
import { authGuard, permissionGuard } from '@abp/ng.core';

const routes: Routes = [
  {
    path: '',
    component: ValueTypeSettingsComponent,
    canActivate: [authGuard, permissionGuard],
    data: { requiredPolicy: 'ClientPortal.Values' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ValueTypeSettingsRoutingModule {}
