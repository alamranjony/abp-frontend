import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreditCardSettingsComponent } from './credit-card-settings.component';

const routes: Routes = [{ path: '', component: CreditCardSettingsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CreditCardSettingsRoutingModule {}
