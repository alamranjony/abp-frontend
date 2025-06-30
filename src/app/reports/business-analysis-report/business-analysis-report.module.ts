import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BusinessAnalysisReportComponent } from './business-analysis-report.component';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { AngularMaterialModule } from 'src/app/shared/angular-material/angular-material.module';

const routes: Routes = [{ path: '', component: BusinessAnalysisReportComponent }];

@NgModule({
  declarations: [BusinessAnalysisReportComponent],
  imports: [RouterModule.forChild(routes), CommonModule, SharedModule, AngularMaterialModule],
})
export class BusinessAnalysisReportModule {}
