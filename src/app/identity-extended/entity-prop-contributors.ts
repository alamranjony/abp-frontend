import { EntityProp, EntityPropList, ePropType } from '@abp/ng.components/extensible';
import { IdentityRoleDto } from '@abp/ng.identity/proxy';
import { eIdentityComponents, IdentityEntityPropContributors } from '@abp/ng.identity';
import { of } from 'rxjs';

const masRoleProp = new EntityProp<IdentityRoleDto>({
  type: ePropType.Boolean,
  name: 'IsMASRole',
  displayName: '::Role.MASRole',
  sortable: false,
  valueResolver: data => {
    return of(data.record.extraProperties.IsMASRole);
  },
});

export function masRolePropContributor(propList: EntityPropList<IdentityRoleDto>) {
  propList.addAfter(masRoleProp, 'IsMASRole', (value, name) => value.name === name);
}

export const identityEntityPropContributors: IdentityEntityPropContributors = {
  [eIdentityComponents.Roles]: [masRolePropContributor],
};
