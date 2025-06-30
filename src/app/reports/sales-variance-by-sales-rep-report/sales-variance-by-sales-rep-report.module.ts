import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SalesVarianceBySalesRepReportComponent } from './sales-variance-by-sales-rep-report.component';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { AngularMaterialModule } from 'src/app/shared/angular-material/angular-material.module';

const routes: Routes = [{ path: '', component: SalesVarianceBySalesRepReportComponent }];

@NgModule({
  declarations: [SalesVarianceBySalesRepReportComponent],
  imports: [RouterModule.forChild(routes), CommonModule, SharedModule, AngularMaterialModule],
})
export class SalesVarianceBySalesRepReportModule {}
