import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { AngularMaterialModule } from 'src/app/shared/angular-material/angular-material.module';
import { DriverReportSummaryComponent } from './driver-report-summary.component';

const routes: Routes = [{ path: '', component: DriverReportSummaryComponent }];

@NgModule({
  declarations: [DriverReportSummaryComponent],
  imports: [RouterModule.forChild(routes), CommonModule, SharedModule, AngularMaterialModule],
})
export class DriverSummaryModule {}
