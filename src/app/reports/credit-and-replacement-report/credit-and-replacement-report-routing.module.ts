import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreditAndReplacementReportComponent } from './credit-and-replacement-report.component';

const routes: Routes = [{ path: '', component: CreditAndReplacementReportComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CreditAndReplacementReportRoutingModule {}
