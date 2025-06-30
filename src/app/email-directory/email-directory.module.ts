import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';

import { EmailDirectoryRoutingModule } from './email-directory-routing.module';
import { EmailDirectoryComponent } from './email-directory.component';

@NgModule({
  declarations: [EmailDirectoryComponent],
  imports: [SharedModule, EmailDirectoryRoutingModule],
  exports: [EmailDirectoryComponent],
})
export class EmailDirectoryModule {}
