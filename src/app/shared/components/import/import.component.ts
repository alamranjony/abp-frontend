import { LocalizationService } from '@abp/ng.core';
import { Component, Inject} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Papa } from 'ngx-papaparse';

@Component({
  selector: 'app-import',
  templateUrl: './import.component.html',
  styleUrl: './import.component.scss',
})
export class ImportComponent {
  selectedFile: any = null;
  errors: string = '';
  importedList: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<ImportComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private papa: Papa,
    private readonly localizationService: LocalizationService,
  ) {}

  onSave(): void {
    if (this.selectedFile) {
      this.dialogRef.close(this.importedList);
    } else {
      this.errors = this.localizationService.instant('::SelectFile');
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0] ?? null;
    if (this.selectedFile) {
      const fileExtension = this.selectedFile.name.split('.').pop().toLowerCase();
      const acceptedExtensions = ['csv'];
      if (!acceptedExtensions.includes(fileExtension)) {
        this.selectedFile = null;
        this.errors = this.localizationService.instant('::InvalidFile');
        return;
      }
      this.errors = '';
      this.parseCSV(this.selectedFile);
    }
  }

  parseCSV(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const csv = reader.result as string;
      this.papa.parse(csv, {
        header: true,
        complete: result => {
          this.importedList = this.mapHeadersToCamelCase(result.data);
        },
        skipEmptyLines: true,
      });
    };
    reader.readAsText(file);
  }

  private mapHeadersToCamelCase(data: any[]): any[] {
    return data.map(row => {
      const transformedRow = {};
      for (const key in row) {
        const camelCaseKey = this.convertToCamelCase(key);
        transformedRow[camelCaseKey] = row[key];
      }
      return transformedRow;
    });
  }

  private convertToCamelCase(header: string): string {
    return header.replace(/\s(.)/g, match => match[1].toUpperCase())
      .replace(/^./, match => match.toLowerCase());
  }
}
