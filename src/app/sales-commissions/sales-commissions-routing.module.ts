import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SalesCommissionsComponent } from './sales-commissions.component';

const routes: Routes = [{ path: '', component: SalesCommissionsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SalesCommissionsRoutingModule {}
