import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ForgetPasswordComponent } from './forget-password.component';
import { RouterModule, Routes } from '@angular/router';
import { AngularMaterialModule } from '../shared/angular-material/angular-material.module';
import { SharedModule } from '../shared/shared.module';

const routes: Routes = [{ path: '', component: ForgetPasswordComponent }];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes), SharedModule, AngularMaterialModule],
  declarations: [ForgetPasswordComponent],
})
export class ForgetPasswordModule {}
