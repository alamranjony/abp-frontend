import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { SmsTemplateRoutingModule } from './sms-template-routing.module';
import { SmsTemplateComponent } from './sms-template.component';
import { AngularMaterialModule } from '../shared/angular-material/angular-material.module';
import { SearchComponent } from '../shared/components/search/search.component';

@NgModule({
  declarations: [SmsTemplateComponent],
  imports: [
    CommonModule,
    SmsTemplateRoutingModule,
    SharedModule,
    AngularMaterialModule,
    SearchComponent,
  ],
})
export class SmsTemplateModule {}
