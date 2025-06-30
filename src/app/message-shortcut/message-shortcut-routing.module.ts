import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard, permissionGuard } from '@abp/ng.core';
import { MessageShortcutComponent } from './message-shortcut.component';

const routes: Routes = [
  {
    path: '',
    component: MessageShortcutComponent,
    canActivate: [authGuard, permissionGuard],
    data: { requiredPolicy: 'ClientPortal.MessageShortcuts' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MessageShortcutRoutingModule {}
