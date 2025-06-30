import { NgModule } from '@angular/core';
import { RoleManagementComponent } from './role-management/role-management.component';
import { SharedModule } from '../shared/shared.module';
import { ExtensibleModule } from '@abp/ng.components/extensible';
import { PermissionManagementModule } from '@abp/ng.permission-management';

@NgModule({
  declarations: [RoleManagementComponent],
  imports: [SharedModule, ExtensibleModule, PermissionManagementModule],
})
export class RoleManagementModule {}
