import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ValueTypeSettingsRoutingModule } from './value-type-settings-routing.module';
import { ValueTypeSettingsComponent } from './value-type-settings.component';
import { SharedModule } from '../shared/shared.module';
import {
  MatCard,
  MatCardHeader,
  MatCardActions,
  MatCardContent,
  MatCardFooter,
  MatCardTitle,
  MatCardTitleGroup,
} from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [ValueTypeSettingsComponent],
  imports: [
    SharedModule,
    CommonModule,
    ValueTypeSettingsRoutingModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    MatCard,
    MatCardHeader,
    MatCardActions,
    MatCardContent,
    MatCardFooter,
    MatCardTitle,
    MatCardTitleGroup,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
  ],
})
export class ValueTypeSettingsModule {}
