import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreditAndReplacementReportRoutingModule } from './credit-and-replacement-report-routing.module';
import { CreditAndReplacementReportComponent } from './credit-and-replacement-report.component';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';

const routes: Routes = [{ path: '', component: CreditAndReplacementReportComponent }];

@NgModule({
  declarations: [CreditAndReplacementReportComponent],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    SharedModule,
    CreditAndReplacementReportRoutingModule,
  ],
})
export class CreditAndReplacementReportModule {}
