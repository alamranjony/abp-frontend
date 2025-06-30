import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { CommonModule } from '@angular/common';
import { ValuetypeRoutingModule } from './valuetype-routing.module';
import { ValuetypeComponent } from './valuetype.component';
import { AngularMaterialModule } from '../shared/angular-material/angular-material.module';
import { ValueTypeListComponent } from './value-type-list/value-type-list.component';
import { ValueTypeDetailsListComponent } from './value-type-details-list/value-type-details-list.component';
import { ValueTypeCreateEditDialogComponent } from './value-type-create-edit-dialog/value-type-create-edit-dialog.component';
import { ValueCreateEditDialogComponent } from './value-create-edit-dialog/value-create-edit-dialog.component';
import { BackButtonComponent } from '../shared/components/back-button/back-button.component';

@NgModule({
  declarations: [
    ValuetypeComponent,
    ValueTypeListComponent,
    ValueTypeCreateEditDialogComponent,
    ValueTypeDetailsListComponent,
    ValueCreateEditDialogComponent,
  ],
  imports: [
    SharedModule,
    CommonModule,
    AngularMaterialModule,
    ValuetypeRoutingModule,
    BackButtonComponent,
  ],
})
export class ValuetypeModule {}
