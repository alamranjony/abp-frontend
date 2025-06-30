import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TermsCodeComponent } from './terms-code.component';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { AngularMaterialModule } from 'src/app/shared/angular-material/angular-material.module';
import { CreateUpdateTermsCodeComponent } from './create-update-terms-code/create-update-terms-code.component';

const routes: Routes = [{ path: '', component: TermsCodeComponent }];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes), SharedModule, AngularMaterialModule],
  declarations: [TermsCodeComponent, CreateUpdateTermsCodeComponent],
})
export class TermsCodeModule {}
