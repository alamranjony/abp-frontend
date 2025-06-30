import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { POSComponent } from './pos.component';

const routes: Routes = [{ path: '', component: POSComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class POSRoutingModule {}
