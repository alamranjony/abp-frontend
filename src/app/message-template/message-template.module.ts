import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageTemplateComponent } from './message-template.component';
import { RouterModule, Routes } from '@angular/router';
import { AngularMaterialModule } from '../shared/angular-material/angular-material.module';
import { SharedModule } from '../shared/shared.module';
import { CreateUpdateMessageTemplateComponent } from './create-update-message-template/create-update-message-template.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';

const routes: Routes = [
  {
    path: '',
    component: MessageTemplateComponent,
  },
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    SharedModule,
    AngularMaterialModule,
    MatExpansionModule,
    MatChipsModule,
  ],
  declarations: [MessageTemplateComponent, CreateUpdateMessageTemplateComponent],
})
export class MessageTemplateModule {}
