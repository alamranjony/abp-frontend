import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CancelledOrdersReportComponent } from './cancelled-orders-report.component';

const routes: Routes = [{ path: '', component: CancelledOrdersReportComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CancelledOrdersReportRoutingModule { }
