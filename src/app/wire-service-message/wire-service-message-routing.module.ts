import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WireServiceMessageComponent } from './wire-service-message.component';

const routes: Routes = [{ path: '', component: WireServiceMessageComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WireServiceMessageRoutingModule {}
