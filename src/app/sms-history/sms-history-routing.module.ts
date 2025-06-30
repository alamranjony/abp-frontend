import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SmsHistoryComponent } from './sms-history.component';

const routes: Routes = [{ path: '', component: SmsHistoryComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SmsHistoryRoutingModule {}
