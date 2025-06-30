import { Component, Input } from '@angular/core';
import { CsvExportService } from '../../services/csv-export.service';
import { ToasterService } from '@abp/ng.theme.shared';

@Component({
  selector: 'app-export-template-csv',
  template: `
    <button mat-raised-button color="accent" class="me-2" type="button" (click)="handleClick()">
      <mat-icon>download</mat-icon>
      <span>{{ '::Payroll:ImportTemplate' | abpLocalization }}</span>
    </button>
  `,
})
export class ExportTemplateComponent {
  @Input() fieldList?: string[];
  @Input() fileName: string;

  constructor(
    private csvExportService: CsvExportService,
    private toaster: ToasterService,
  ) {}

  handleClick() {
    try {
      this.csvExportService.exportToCsvTemplate(this.fileName + '.csv', this.fieldList);
    } catch (error) {
      this.toaster.error('::Payroll:ImportTemplateError');
    }
  }
}
