import { NgModule } from '@angular/core';
import { WireServiceMessageRoutingModule } from './wire-service-message-routing.module';
import { WireServiceMessageComponent } from './wire-service-message.component';
import { SharedModule } from '../shared/shared.module';
import { ListService } from '@abp/ng.core';
import { WireServiceMessageDialogComponent } from './wire-service-message-dialog/wire-service-message-dialog.component';

@NgModule({
  declarations: [WireServiceMessageComponent, WireServiceMessageDialogComponent],
  imports: [WireServiceMessageRoutingModule, SharedModule],
  providers: [ListService],
})
export class WireServiceMessageModule {}
