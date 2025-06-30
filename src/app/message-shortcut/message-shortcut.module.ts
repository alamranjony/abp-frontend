import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { MessageShortcutRoutingModule } from './message-shortcut-routing.module';
import { MessageShortcutComponent } from './message-shortcut.component';
import { MessageShortcutDialogComponent } from './message-shortcut-dialog/message-shortcut-dialog.component';

@NgModule({
  declarations: [MessageShortcutComponent, MessageShortcutDialogComponent],
  imports: [SharedModule, MessageShortcutRoutingModule],
})
export class MessageShortcutModule {}
