import { Component, Injector, OnInit } from '@angular/core';
import {
  ListService,
  MultiTenancyService,
  PagedAndSortedResultRequestDto,
  PagedResultDto,
} from '@abp/ng.core';
import {
  EXTENSIONS_IDENTIFIER,
  FormPropData,
  generateFormFromProps,
} from '@abp/ng.components/extensible';
import { eIdentityComponents, RolesComponent } from '@abp/ng.identity';
import { IdentityRoleDto, IdentityRoleService } from '@abp/ng.identity/proxy';
import { FormGroup } from '@angular/forms';
import { ePermissionManagementComponents } from '@abp/ng.permission-management';
import { Confirmation, ConfirmationService, ToasterService } from '@abp/ng.theme.shared';
import { finalize } from 'rxjs/operators';
import { RoleManagementService } from '../../shared/services/role-management-service';

@Component({
  selector: 'app-role-management',
  templateUrl: './role-management.component.html',
  styleUrl: './role-management.component.scss',
  providers: [
    ListService,
    {
      provide: EXTENSIONS_IDENTIFIER,
      useValue: eIdentityComponents.Roles,
    },
    {
      provide: RolesComponent,
      useExisting: RoleManagementComponent,
    },
  ],
})
export class RoleManagementComponent implements OnInit {
  data: PagedResultDto<IdentityRoleDto> = { items: [], totalCount: 0 };
  form: FormGroup;
  selected: IdentityRoleDto;
  isModalVisible: boolean;
  visiblePermissions = false;
  providerKey: string;
  modalBusy = false;
  permissionManagementKey = ePermissionManagementComponents.PermissionManagement;
  readonly hostTenantName = 'HOST';
  currentTenantName: string;
  editEnabled: boolean = true;

  onVisiblePermissionChange = event => {
    this.visiblePermissions = event;
  };

  constructor(
    public readonly list: ListService<PagedAndSortedResultRequestDto>,
    protected confirmationService: ConfirmationService,
    protected injector: Injector,
    protected service: IdentityRoleService,
    private tenantService: MultiTenancyService,
    private roleManagementService: RoleManagementService,
    private toaster: ToasterService,
  ) {}

  ngOnInit() {
    this.currentTenantName = this.tenantService?.domainTenant?.name ?? this.hostTenantName;

    this.hookToQuery();

    this.roleManagementService.refresh$.subscribe(() => {
      this.list.get();
    });
  }

  buildForm() {
    const data = new FormPropData(this.injector, this.selected);
    this.form = generateFormFromProps(data);
  }

  openModal() {
    const masRole = this.selected?.extraProperties?.IsMASRole ?? false;
    this.editEnabled = this.currentTenantName == this.hostTenantName ? true : !masRole;
    this.buildForm();
    this.isModalVisible = true;
  }

  add() {
    this.selected = {} as IdentityRoleDto;
    this.openModal();
  }

  edit(id: string) {
    this.service.get(id).subscribe(res => {
      this.selected = res;
      this.openModal();
    });
  }

  save() {
    if (!this.form.valid) {
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }

    this.modalBusy = true;

    const { id } = this.selected;

    const dto = {
      ...this.form.value,
    };

    if (id) {
      dto.extraProperties = this.selected.extraProperties;
    } else {
      dto.extraProperties.IsMASRole =
        this.currentTenantName === this.hostTenantName ? dto.extraProperties.IsMASRole : false;
    }
    (id ? this.service.update(id, dto) : this.service.create(dto))
      .pipe(finalize(() => (this.modalBusy = false)))
      .subscribe(() => {
        this.isModalVisible = false;
        this.list.get();
      });
  }

  delete(id: string, name: string) {
    const roleToBeDeleted = this.data.items.find(x => x.id === id);
    if (
      roleToBeDeleted.extraProperties.IsMASRole &&
      this.currentTenantName !== this.hostTenantName
    ) {
      this.toaster.error('::MasRole.Delete.ErrorMessage', '::MasRole.Delete.ErrorTitle');
      return;
    }
    this.confirmationService
      .warn('AbpIdentity::RoleDeletionConfirmationMessage', 'AbpIdentity::AreYouSure', {
        messageLocalizationParams: [name],
      })
      .subscribe((status: Confirmation.Status) => {
        if (status === Confirmation.Status.confirm) {
          this.service.delete(id).subscribe(() => this.list.get());
        }
      });
  }

  private hookToQuery() {
    this.list.hookToQuery(query => this.service.getList(query)).subscribe(res => (this.data = res));
  }

  openPermissionsModal(providerKey: string) {
    this.providerKey = providerKey;
    setTimeout(() => {
      this.visiblePermissions = true;
    }, 0);
  }

  sort(data) {
    const { prop, dir } = data.sorts[0];
    this.list.sortKey = prop;
    this.list.sortOrder = dir;
  }
}
