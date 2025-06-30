import { NgModule } from '@angular/core';
import { CommunicationBoxComponent } from './communication-box.component';
import { CommunicationDialogComponent } from './communication-dialog/communication-dialog.component';
import { InboxTabComponent } from './communication-dialog/tabs/inbox-tab/inbox-tab.component';
import { SendMessageTabComponent } from './communication-dialog/tabs/send-message-tab/send-message-tab.component';
import { SentMessagesTabComponent } from './communication-dialog/tabs/sent-messages-tab/sent-messages-tab.component';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { MatProgressBar } from '@angular/material/progress-bar';

@NgModule({
  declarations: [
    CommunicationBoxComponent,
    CommunicationDialogComponent,
    InboxTabComponent,
    SendMessageTabComponent,
    SentMessagesTabComponent,
  ],
  imports: [CommonModule, SharedModule, MatProgressBar],
})
export class CommunicationBoxModule {}
