import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InvoiceReportComponent } from './invoice-report.component';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { AngularMaterialModule } from '../shared/angular-material/angular-material.module';

const routes: Routes = [{ path: '', component: InvoiceReportComponent }];

@NgModule({
  declarations: [InvoiceReportComponent],
  imports: [RouterModule.forChild(routes), CommonModule, SharedModule, AngularMaterialModule],
})
export class InvoiceReportModule {}
