import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WireServiceSetupComponent } from './wire-service-setup.component';
import { SharedModule } from '../shared/shared.module';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';

const routes: Routes = [{ path: '', component: WireServiceSetupComponent }];

@NgModule({
  declarations: [WireServiceSetupComponent],
  imports: [RouterModule.forChild(routes), SharedModule],
})
export class WireServiceSetupModule {}
