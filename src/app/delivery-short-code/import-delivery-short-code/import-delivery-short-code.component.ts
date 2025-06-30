import { LocalizationService } from '@abp/ng.core';
import { ToasterService } from '@abp/ng.theme.shared';
import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ImportComponent } from 'src/app/shared/components/import/import.component';
import { SharedModule } from 'src/app/shared/shared.module';
import * as XLSX from 'xlsx';
import { JsonRow, ImportShortCodeDto } from './short-code.model';

@Component({
  selector: 'app-import-delivery-short-code',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './import-delivery-short-code.component.html',
  styleUrl: './import-delivery-short-code.component.scss',
})
export class ImportDeliveryShortCodeComponent {
  shortCodes: JsonRow[] = [];
  selectedFile: File | null = null;
  errors: string = '';
  private readonly validExtensions = ['xlsx', 'xls'];
  private readonly fields = {
    required: {
      ShortCode: 'Short_Code*',
      LocationName: 'Location_Name*',
      Address1: 'Address1*',
      StateProvince: 'State/Province*',
      City: 'City*',
      ZipCode: 'Zip_Code*',
      TypeofDelivery: 'Delivery_Type*',
    },
    optional: {
      Country: 'Country',
      Address2: 'Address2',
      PhoneNumber: 'Phone_Number',
      SpecialInstruction: 'Special_Instruction',
      UseDefaultDeliveryCharge: 'Use_Default_Delivery_Charge',
      StoreCode: 'Store_Code',
      DeliveryZone: 'Delivery_Zone',
      SpecialDeliveryCharge: 'Special_Delivery_Charge',
    },
  };

  constructor(
    public dialogRef: MatDialogRef<ImportComponent>,
    private readonly localizationService: LocalizationService,
    private readonly toaster: ToasterService,
  ) {}

  onSave(): void {
    if (this.selectedFile) {
      const shortCodeList = this.mapJsonToShortCodesDto(this.shortCodes);
      this.dialogRef.close(shortCodeList);
    } else this.errors = this.localizationService.instant('::SelectFile');
  }

  onClose = (): void => this.dialogRef.close();

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length !== 1) {
      this.toaster.error('::ErrorShortCodeUpload');
      return;
    }

    this.selectedFile = target.files[0];
    this.errors = '';
    const fileName = this.selectedFile.name.toLowerCase();
    const fileExtension = fileName.split('.').pop();

    if (!this.validExtensions.includes(fileExtension)) {
      this.selectedFile = null;
      this.toaster.error('::ImportFileFormatError');
      return;
    }

    const reader: FileReader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      const bstr: string = e.target?.result as string;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as (string | number)[][];

      this.shortCodes = this.jsonFormatter(data);
    };

    reader.readAsArrayBuffer(this.selectedFile);
  }

  private jsonFormatter(data: (string | number | null)[][]): JsonRow[] {
    const headers = data[0];
    const result: JsonRow[] = [];

    for (let i = 1; i < data.length; i++) {
      const obj: JsonRow = {};
      for (let j = 0; j < headers.length; j++)
        obj[headers[j]] = data[i][j] === undefined ? null : data[i][j];
      result.push(obj);
    }

    return result;
  }

  private isRowEmpty(data: JsonRow): boolean {
    return Object.values(data).every(
      value => value === null || value === '' || value === undefined,
    );
  }

  private validateRow(data: JsonRow, rowIndex: number): string {
    const missingFields: string[] = [];
    const rowErrors: string[] = [];

    Object.values(this.fields.required).forEach(field => {
      if (!data[field]) missingFields.push(field);
    });

    const useDefaultCharge = this.convertYesNoToBoolean(
      data.Use_Default_Delivery_Charge as string | '',
    );

    if (!useDefaultCharge) {
      if (!data.Special_Delivery_Charge) {
        rowErrors.push(
          `${this.localizationService.instant('::DeliveryShortCodeImport:SpecialDeliveryCharge')}`,
        );
      } else if (!this.isValidPrice(data.Special_Delivery_Charge)) {
        rowErrors.push(
          this.localizationService.instant(
            '::DeliveryShortCodeImport:InvalidSpecialDeliveryCharge',
          ),
        );
      }
    }

    if (missingFields.length) {
      rowErrors.push(
        `${missingFields.join(', ')} ${
          missingFields.length > 1
            ? this.localizationService.instant('::DeliveryShortCodeImport:AreRequired')
            : this.localizationService.instant('::DeliveryShortCodeImport:IsRequired')
        }`,
      );
    }

    if (rowErrors.length > 0) return `Row ${rowIndex}: ${rowErrors.join('; ')}`;
    return '';
  }

  private isValidPrice = (price: string | number): boolean =>
    price !== '' && price !== null && price !== undefined && Number(price) > 0;

  private mapJsonToShortCodesDto(jsonData: JsonRow[]): ImportShortCodeDto[] {
    const validShortCodes: ImportShortCodeDto[] = [];
    jsonData
      .filter(data => {
        return !this.isRowEmpty(data);
      })
      .forEach((data, index) => {
        const validationErrors = this.validateRow(data, index + 2);
        if (validationErrors) {
          this.toaster.error(validationErrors);
          this.onClose();
          return;
        }

        const mappedShortCode: Partial<ImportShortCodeDto> = {};
        Object.entries(this.fields.required).forEach(([key, field]) => {
          mappedShortCode[key] = data[field].toString();
        });

        Object.entries(this.fields.optional).forEach(([key, field]) => {
          if (key === 'UseDefaultDeliveryCharge') {
            mappedShortCode[key] = this.convertYesNoToBoolean(
              (data[field] as string | undefined) || '',
            );
          } else if (key === 'SpecialDeliveryCharge') {
            let defaultValue = this.convertYesNoToBoolean(
              (data.Use_Default_Delivery_Charge as string | undefined) || '',
            );
            if (defaultValue && !data[field]) mappedShortCode[key] = 0;
            else mappedShortCode[key] = Number(data[field]);
          } else if (key === 'PhoneNumber') {
            mappedShortCode[key] = data[field] ? String(data[field]) : '';
          } else mappedShortCode[key] = (data[field] as string) || '';
        });
        validShortCodes.push(mappedShortCode as ImportShortCodeDto);
      });

    return validShortCodes;
  }

  private convertYesNoToBoolean(value: string, defaultValue: boolean = false): boolean {
    if (!value) return defaultValue;
    const lowerValue = value.trim().toLowerCase();
    if (lowerValue === 'yes') return true;
    if (lowerValue === 'no') return false;
    return defaultValue;
  }
}
