import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { StoreWireServiceAllocationComponent } from './store-wire-service-allocation.component';
import { SharedModule } from '../shared/shared.module';
import { MatFormFieldModule } from '@angular/material/form-field';

const routes: Routes = [{ path: '', component: StoreWireServiceAllocationComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes), CommonModule, SharedModule, MatFormFieldModule],
  declarations: [StoreWireServiceAllocationComponent],
})
export class StoreWireServiceAllocationModule {}
