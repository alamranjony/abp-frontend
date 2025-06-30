import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { AngularMaterialModule } from 'src/app/shared/angular-material/angular-material.module';
import { ProductSalesComparisonsBySalesPersonReportComponent } from './product-sales-comparisons-by-sales-person-report.component';

const routes: Routes = [
  { path: '', component: ProductSalesComparisonsBySalesPersonReportComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes), CommonModule, SharedModule, AngularMaterialModule],
  declarations: [ProductSalesComparisonsBySalesPersonReportComponent],
})
export class ProductSalesComparisonsBySalesPersonReportModule {}
