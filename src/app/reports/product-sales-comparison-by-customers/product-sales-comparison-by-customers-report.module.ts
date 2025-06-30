import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { AngularMaterialModule } from 'src/app/shared/angular-material/angular-material.module';
import { ProductSalesComparisonByCustomerReportComponent } from './product-sales-comparison-by-customers-report.component';

const routes: Routes = [{ path: '', component: ProductSalesComparisonByCustomerReportComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes), CommonModule, SharedModule, AngularMaterialModule],
  declarations: [ProductSalesComparisonByCustomerReportComponent],
})
export class ProductSalesComparisonByCustomerReportModule {}
