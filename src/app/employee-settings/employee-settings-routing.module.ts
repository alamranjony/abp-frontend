import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EmployeeSettingsComponent } from './employee-settings.component';

const routes: Routes = [{ path: '', component: EmployeeSettingsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EmployeeSettingsRoutingModule {}
