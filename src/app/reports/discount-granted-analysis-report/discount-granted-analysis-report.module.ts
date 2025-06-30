import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiscountGrantedAnalysisReportComponent } from './discount-granted-analysis-report.component';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { AngularMaterialModule } from 'src/app/shared/angular-material/angular-material.module';

const routes: Routes = [{ path: '', component: DiscountGrantedAnalysisReportComponent }];

@NgModule({
  declarations: [DiscountGrantedAnalysisReportComponent],
  imports: [RouterModule.forChild(routes), CommonModule, SharedModule, AngularMaterialModule],
})
export class DiscountGrantedAnalysisReportModule {}
