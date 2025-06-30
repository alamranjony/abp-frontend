import { Component } from '@angular/core';
import { IdentityRoleDto } from '@abp/ng.identity/proxy';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IdentityRoleCopyDto, MasRoleService } from '@proxy/identity';
import { Router } from '@angular/router';
import { RoleManagementService } from '../../shared/services/role-management-service';
import { ToasterService } from '@abp/ng.theme.shared';

@Component({
  selector: 'app-identity-role-extended',
  templateUrl: './identity-role-extended.component.html',
  styleUrl: './identity-role-extended.component.scss',
})
export class IdentityRoleExtendedComponent {
  isCopyRoleVisible: boolean;
  role: IdentityRoleDto;
  form: FormGroup;
  modalBusy = false;
  constructor(
    private fb: FormBuilder,
    private masRoleService: MasRoleService,
    private roleManagementService: RoleManagementService,
    private toaster: ToasterService,
  ) {
    this.buildForm();
  }

  buildForm() {
    this.form = this.fb.group({
      name: [null, Validators.required],
      isDefault: [false],
      isPublic: [false],
    });
  }

  save() {
    if (this.form.invalid) {
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }

    this.modalBusy = true;
    const copyRoleDto: IdentityRoleCopyDto = {
      ...this.form.value,
    };
    copyRoleDto.providerKey = this.role.name;

    const request = this.masRoleService.copyRole(copyRoleDto);
    request.subscribe({
      complete: () => {
        this.isCopyRoleVisible = false;
        this.modalBusy = false;
        this.form.reset();
        this.roleManagementService.emitRefresh();
      },
    });
  }

  openCopyRoleView(record: IdentityRoleDto) {
    this.role = new Proxy(record, {
      get: (target, prop) => target[prop] || '—',
    });
    this.isCopyRoleVisible = true;
  }
}
