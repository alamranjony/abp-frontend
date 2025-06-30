import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QueuedEmailsComponent } from './queued-emails.component';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { AngularMaterialModule } from '../shared/angular-material/angular-material.module';

const routes: Routes = [{ path: '', component: QueuedEmailsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes), CommonModule, SharedModule, AngularMaterialModule],
  declarations: [QueuedEmailsComponent],
})
export class QueuedEmailsModule {}
