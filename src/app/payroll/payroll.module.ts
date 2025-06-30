import { NgModule } from '@angular/core';
import { PayrollRoutingModule } from './payroll-routing.module';
import { PayrollComponent } from './payroll.component';
import { SharedModule } from '../shared/shared.module';
import { PayrollDialogComponent } from './payroll-dialog/payroll-dialog.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';


@NgModule({
  declarations: [
    PayrollComponent,
    PayrollDialogComponent
  ],
  imports: [
    SharedModule,
    PayrollRoutingModule,
    MatAutocompleteModule
  ]
})
export class PayrollModule { }
