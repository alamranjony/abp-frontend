import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';

import { PhoneDirectoryRoutingModule } from './phone-directory-routing.module';
import { PhoneDirectoryComponent } from './phone-directory.component';

@NgModule({
  declarations: [PhoneDirectoryComponent],
  imports: [SharedModule, PhoneDirectoryRoutingModule],
  exports: [PhoneDirectoryComponent],
})
export class PhoneDirectoryModule {}
