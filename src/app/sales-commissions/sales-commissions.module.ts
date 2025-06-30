import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SalesCommissionsRoutingModule } from './sales-commissions-routing.module';
import { SalesCommissionsComponent } from './sales-commissions.component';
import { SharedModule } from '../shared/shared.module';
import { AngularMaterialModule } from '../shared/angular-material/angular-material.module';

@NgModule({
  declarations: [SalesCommissionsComponent],
  imports: [CommonModule, SharedModule, AngularMaterialModule, SalesCommissionsRoutingModule],
})
export class SalesCommissionsModule {}
