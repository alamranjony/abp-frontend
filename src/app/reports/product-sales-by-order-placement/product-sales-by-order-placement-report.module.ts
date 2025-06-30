import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { AngularMaterialModule } from 'src/app/shared/angular-material/angular-material.module';
import { ProductSalesByOrderPlacementReportComponent } from './product-sales-by-order-placement-report.component';

const routes: Routes = [{ path: '', component: ProductSalesByOrderPlacementReportComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes), CommonModule, SharedModule, AngularMaterialModule],
  declarations: [ProductSalesByOrderPlacementReportComponent],
})
export class ProductSalesByOrderPlacementReportModule {}
