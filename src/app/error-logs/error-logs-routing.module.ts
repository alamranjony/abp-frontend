import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ErrorLogsComponent } from './error-logs.component';

const routes: Routes = [{ path: '', component: ErrorLogsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ErrorLogsRoutingModule {}
