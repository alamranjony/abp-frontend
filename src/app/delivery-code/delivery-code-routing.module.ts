import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DeliveryCodeComponent } from './delivery-code.component';

const routes: Routes = [{ path: '', component: DeliveryCodeComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DeliveryCodeRoutingModule {}
