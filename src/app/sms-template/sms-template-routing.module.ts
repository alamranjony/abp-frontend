import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SmsTemplateComponent } from './sms-template.component';

const routes: Routes = [{ path: '', component: SmsTemplateComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SmsTemplateRoutingModule {}
