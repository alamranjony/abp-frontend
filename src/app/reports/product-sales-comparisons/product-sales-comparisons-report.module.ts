import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { AngularMaterialModule } from 'src/app/shared/angular-material/angular-material.module';
import { ProductSalesComparisonsReportComponent } from './product-sales-comparisons-report.component';

const routes: Routes = [{ path: '', component: ProductSalesComparisonsReportComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes), CommonModule, SharedModule, AngularMaterialModule],
  declarations: [ProductSalesComparisonsReportComponent],
})
export class ProductSalesComparisonsReportModule {}
