import { NgModule } from '@angular/core';
import { IdentityRoleExtendedComponent } from './identity-role-extended/identity-role-extended.component';
import { CoreModule } from '@abp/ng.core';
import { ThemeSharedModule } from '@abp/ng.theme.shared';
import { RouterModule } from '@angular/router';
import { IdentityModule } from '@abp/ng.identity';
import { identityEntityActionContributors } from '../identity-extended/entity-action-contributors';
import { identityEntityPropContributors } from '../identity-extended/entity-prop-contributors';

@NgModule({
  declarations: [IdentityRoleExtendedComponent],
  imports: [
    CoreModule,
    ThemeSharedModule,
    RouterModule.forChild([
      {
        path: '',
        component: IdentityRoleExtendedComponent,
        children: [
          {
            path: '',
            loadChildren: () =>
              IdentityModule.forLazy({
                entityActionContributors: identityEntityActionContributors,
                entityPropContributors: identityEntityPropContributors,
              }),
          },
        ],
      },
    ]),
  ],
})
export class IdentityRoleExtendedModule {}
