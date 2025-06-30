import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { AngularMaterialModule } from '../shared/angular-material/angular-material.module';
import { MiscOrderListComponent } from './misc-order-list/misc-order-list.component';

const routes: Routes = [
  {
    path: '',
    component: MiscOrderListComponent,
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes), CommonModule, SharedModule, AngularMaterialModule],
  declarations: [MiscOrderListComponent],
})
export class MiscOrdersModule {}
