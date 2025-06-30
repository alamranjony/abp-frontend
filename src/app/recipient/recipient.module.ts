import { NgModule } from '@angular/core';
import { RecipientRoutingModule } from './recipient-routing.module';
import { SharedModule } from '../shared/shared.module';
import { AngularMaterialModule } from '../shared/angular-material/angular-material.module';
import { RecipientComponent } from './recipient.component';
import { RecipientDialogComponent } from './recipient-dialog/recipient-dialog.component';

@NgModule({
  declarations: [RecipientComponent, RecipientDialogComponent],
  imports: [SharedModule, RecipientRoutingModule, AngularMaterialModule],
})
export class RecipientModule {}
