import { Component, Input } from '@angular/core';
import { CsvExportService } from '../../services/csv-export.service';
import { ToasterService } from '@abp/ng.theme.shared';

@Component({
  selector: 'app-export-csv',
  template: `
    <button
      mat-raised-button
      color="accent"
      [class.me-2]="!suppressSpacing"
      type="button"
      (click)="handleClick()"
    >
      <mat-icon>download</mat-icon>
      <span>{{ '::Export' | abpLocalization }}</span>
    </button>
  `,
})
export class ExportComponent {
  @Input() apiUrl: string;
  @Input() fileName: string;
  @Input() queryParams = {};
  @Input() fieldList?: string[];
  @Input() displayColumnList?: string[];
  @Input() hasQueryParams = true;
  @Input() suppressSpacing = false;
  @Input() isCustomMethodWithParam = false;

  constructor(
    private csvExportService: CsvExportService,
    private toaster: ToasterService,
  ) {}

  handleClick() {
    this.csvExportService
      .fetchData(this.apiUrl, this.queryParams, this.hasQueryParams, this.isCustomMethodWithParam)
      .subscribe({
        next: response => {
          const apiResponse = response as {
            items?: any[];
            totalCount?: number;
          };
          if (apiResponse?.totalCount == 0) {
            this.toaster.error('::Export.NoData');
            return;
          }
          this.csvExportService.exportToCsv(
            this.fileName + '.csv',
            apiResponse?.items,
            this.fieldList,
            this.displayColumnList,
          );
        },
        error: () => {
          this.toaster.error('::Export.Error');
        },
      });
  }
}
