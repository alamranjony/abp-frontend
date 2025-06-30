import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from '../shared/angular-material/angular-material.module';
import { SharedModule } from '../shared/shared.module';
import { RouterModule, Routes } from '@angular/router';
import { CalendarComponent } from './calendar.component';
import { AppointmentDialogComponent } from './appointment-dialog/appointment-dialog.component';

const routes: Routes = [
  { path: '', component: CalendarComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes),
    AngularMaterialModule,
    CommonModule,
    SharedModule,
    AppointmentDialogComponent],
  declarations: [CalendarComponent]
})
export class CalendarModule { }
