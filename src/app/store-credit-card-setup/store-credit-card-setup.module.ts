import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { StoreCreditCardSetupComponent } from './store-credit-card-setup.component';
import { SharedModule } from 'src/app/shared/shared.module';

const routes: Routes = [{ path: '', component: StoreCreditCardSetupComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes), CommonModule, SharedModule, MatFormFieldModule],
  declarations: [StoreCreditCardSetupComponent],
})
export class StoreCreditCardSetupModule {}
