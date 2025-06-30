import {
  eIdentityComponents,
  IdentityToolbarActionContributors,
  UsersComponent,
} from '@abp/ng.identity';
import { IdentityUserDto } from '@abp/ng.identity/proxy';

import { ToolbarAction, ToolbarActionList } from '@abp/ng.components/extensible';
import { CsvExportService } from '../services/csv-export.service';
import { EXPORT_CONFIG } from './export-config';

const exportUsersToCsv = new ToolbarAction<IdentityUserDto[]>({
  text: 'Export to CSV',
  icon: 'fa fa-file-csv',

  action: data => {
    const csvExportService = data.getInjected(CsvExportService);
    const userComponent = data.getInjected(UsersComponent);
    const queryParams = {};
    if (userComponent.list.filter) {
      queryParams['filter'] = userComponent.list.filter;
    }

    csvExportService.fetchData(EXPORT_CONFIG.userUrl, queryParams).subscribe(
      response => {
        const apiResponse = response as {
          items?: any[];
          totalCount?: number;
        };
        const usersData = apiResponse.items.map(user => ({
          userName: user.userName,
          name: user.name,
          surname: user.surname,
          email: user.email,
          phoneNumber: user.phoneNumber,
        }));
        csvExportService.exportToCsv('users.csv', usersData);
      },
      error => {
        console.error('Error fetching data', error);
      },
    );
  },
});

export function exportUsersToCsvContributor(actionList: ToolbarActionList<IdentityUserDto[]>) {
  actionList.addHead(exportUsersToCsv);
}

export const identityToolbarActionContributors: IdentityToolbarActionContributors = {
  [eIdentityComponents.Users]: [exportUsersToCsvContributor],
};
