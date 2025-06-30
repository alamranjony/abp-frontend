import { NgModule } from '@angular/core';
import { LockedOrderListComponent } from './locked-order-list.component';
import { SharedModule } from '../shared/shared.module';
import { RouterModule, Routes } from '@angular/router';
import { ListService } from '@abp/ng.core';

const routes: Routes = [{ path: '', component: LockedOrderListComponent }];

@NgModule({
  declarations: [LockedOrderListComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
  providers: [ListService],
})
export class LockedOrderListModule {}
