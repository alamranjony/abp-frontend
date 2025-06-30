import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SchedulerSettingsComponent } from './scheduler-settings.component';

const routes: Routes = [{ path: '', component: SchedulerSettingsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SchedulerSettingsRoutingModule {}
