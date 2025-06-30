import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ShippingServiceComponent } from './shipping-service.component';

const routes: Routes = [{ path: '', component: ShippingServiceComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ShippingServiceRoutingModule {}
