import { EntityAction, EntityActionList } from '@abp/ng.components/extensible';
import { IdentityRoleDto } from '@abp/ng.identity/proxy';
import { IdentityRoleExtendedComponent } from '../identity-role-extended/identity-role-extended/identity-role-extended.component';
import { eIdentityComponents, IdentityEntityActionContributors } from '@abp/ng.identity';
import { EntityActionNames } from './entity-action-consts';

const copyRoleAction = new EntityAction<IdentityRoleDto>({
  text: EntityActionNames.COPY_ROLE,
  action: data => {
    const component = data.getInjected(IdentityRoleExtendedComponent);
    component.openCopyRoleView(data.record);
  },
});

export function customModalContributor(actionList: EntityActionList<IdentityRoleDto>) {
  actionList.addTail(copyRoleAction);
}

export const identityEntityActionContributors: IdentityEntityActionContributors = {
  [eIdentityComponents.Roles]: [customModalContributor],
};
