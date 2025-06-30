import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_FORMATS, MatNativeDateModule, MatRippleModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogActions, MatDialogContent, MatDialogModule } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { GLOBAL_DATE_FORMAT } from '../constants';
import { MatList, MatListItem } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';

export const MAT_DATE_PICKER_FORMAT = {
  parse: {
    dateInput: GLOBAL_DATE_FORMAT,
  },
  display: {
    dateInput: GLOBAL_DATE_FORMAT,
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatCheckboxModule,
    MatIconModule,
    MatSelectModule,
    MatRadioModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatSortModule,
    MatMenuModule,
    MatDialogModule,
    MatRadioModule,
    MatPaginatorModule,
    MatMenuModule,
    ReactiveFormsModule,
    MatGridListModule,
    MatDialogContent,
    MatDialogActions,
    MatTabsModule,
    MatDividerModule,
    MatTooltipModule,
    MatRippleModule,
    MatExpansionModule,
    MatProgressSpinner,
    MatChipsModule,
    MatAutocompleteModule,
    MatSlideToggleModule,
    MatListItem,
    MatList,
    MatBadgeModule,
  ],
  exports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatCheckboxModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatSortModule,
    MatMenuModule,
    MatDialogModule,
    MatRadioModule,
    MatPaginatorModule,
    MatMenuModule,
    ReactiveFormsModule,
    MatGridListModule,
    MatDialogContent,
    MatDialogActions,
    MatRadioModule,
    MatTabsModule,
    MatDividerModule,
    MatTooltipModule,
    MatRippleModule,
    MatExpansionModule,
    MatProgressSpinner,
    MatChipsModule,
    MatAutocompleteModule,
    MatSlideToggleModule,
    MatListItem,
    MatList,
    MatBadgeModule,
  ],
  providers: [{ provide: MAT_DATE_FORMATS, useValue: MAT_DATE_PICKER_FORMAT }],
})
export class AngularMaterialModule {}
