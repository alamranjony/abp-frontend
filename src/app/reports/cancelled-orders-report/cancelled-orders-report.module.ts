import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CancelledOrdersReportRoutingModule } from './cancelled-orders-report-routing.module';
import { CancelledOrdersReportComponent } from './cancelled-orders-report.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { AngularMaterialModule } from 'src/app/shared/angular-material/angular-material.module';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [{ path: '', component: CancelledOrdersReportComponent }];
@NgModule({
  declarations: [CancelledOrdersReportComponent],
  imports: [RouterModule.forChild(routes), CommonModule, CancelledOrdersReportRoutingModule, SharedModule, AngularMaterialModule],
})
export class CancelledOrdersReportModule {}
