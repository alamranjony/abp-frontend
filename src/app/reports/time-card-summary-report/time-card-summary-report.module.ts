import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeCardSummaryReportComponent } from './time-card-summary-report.component';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { AngularMaterialModule } from 'src/app/shared/angular-material/angular-material.module';

const routes: Routes = [{ path: '', component: TimeCardSummaryReportComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes), CommonModule, SharedModule, AngularMaterialModule],
  declarations: [TimeCardSummaryReportComponent],
})
export class TimeCardSummaryReportModule {}
