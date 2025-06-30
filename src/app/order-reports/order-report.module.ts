import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { AngularMaterialModule } from '../shared/angular-material/angular-material.module';
import { OrderReportComponent } from './order-report.component';

const routes: Routes = [{ path: '', component: OrderReportComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes), CommonModule, SharedModule, AngularMaterialModule],
  declarations: [OrderReportComponent],
})
export class OrderReportModule {}
