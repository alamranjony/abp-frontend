import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LockedOrderListComponent } from './locked-order-list.component';

const routes: Routes = [{ path: '', component: LockedOrderListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LockedOrderListRoutingModule {}
