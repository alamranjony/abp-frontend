import { NgModule } from '@angular/core';
import { PrinterSetupRoutingModule } from './printer-setup-routing.module';
import { PrinterSetupComponent } from './printer-setup.component';
import { SharedModule } from '../shared/shared.module';
import { PrinterTraySelectorComponent } from './printer-tray-selector/printer-tray-selector.component';
import { PrinterSetupOverrideComponent } from './printer-setup-override/printer-setup-override.component';
import { ListService } from '@abp/ng.core';
import { PrinterSetupOverrideDialogComponent } from './printer-setup-override-dialog/printer-setup-override-dialog.component';

@NgModule({
  declarations: [
    PrinterSetupComponent,
    PrinterTraySelectorComponent,
    PrinterSetupOverrideComponent,
    PrinterSetupOverrideDialogComponent,
  ],
  imports: [SharedModule, PrinterSetupRoutingModule],
  providers: [ListService],
})
export class PrinterSetupModule {}
