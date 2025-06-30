import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DeliveryShortCodeComponent } from './delivery-short-code.component';

const routes: Routes = [{ path: '', component: DeliveryShortCodeComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DeliveryShortCodeRoutingModule { }
