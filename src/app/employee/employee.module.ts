import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeRoutingModule } from './employee-routing.module';
import { EmployeeComponent } from './employee.component';
import { SharedModule } from '../shared/shared.module';
import { AngularMaterialModule } from '../shared/angular-material/angular-material.module';
import { EmployeeListComponent } from './employee-list/employee-list.component';
import { EmployeeFormComponent } from './employee-form/employee-form.component';
import { SearchComponent } from '../shared/components/search/search.component';
import { BackButtonComponent } from '../shared/components/back-button/back-button.component';

@NgModule({
  declarations: [EmployeeComponent, EmployeeListComponent, EmployeeFormComponent],
  imports: [
    CommonModule,
    SharedModule,
    AngularMaterialModule,
    EmployeeRoutingModule,
    SearchComponent,
    BackButtonComponent,
  ],
})
export class EmployeeModule {}
