import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EmployeeComponent } from './employee.component';
import { EmployeeListComponent } from './employee-list/employee-list.component';
import { EmployeeFormComponent } from './employee-form/employee-form.component';
import { authGuard, permissionGuard } from '@abp/ng.core';

const routes: Routes = [
  {
    path: '',
    component: EmployeeComponent,
    children: [
      {
        path: '',
        component: EmployeeListComponent,
      },
      {
        path: 'create',
        component: EmployeeFormComponent,
        canActivate: [authGuard, permissionGuard],
        data: { requiredPolicy: 'ClientPortal.Employees.CreateAndEdit' },
      },
      {
        path: 'edit/:id',
        component: EmployeeFormComponent,
        canActivate: [authGuard, permissionGuard],
        data: { requiredPolicy: 'ClientPortal.Employees.CreateAndEdit' },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EmployeeRoutingModule {}
