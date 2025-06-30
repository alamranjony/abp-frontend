import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  Output,
  TemplateRef,
} from '@angular/core';
import {
  DeliveryZoneCoordinateDto,
  DeliveryZoneDto,
  DeliveryZoneService,
  ImportDeliveryZoneResponseDto,
  ZoneAreaSelector,
  zoneAreaSelectorOptions,
  zoneTypeOptions,
} from '@proxy/deliveries';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Confirmation, ConfirmationService, ToasterService } from '@abp/ng.theme.shared';
import { StoreLookupDto, StoreService } from '@proxy/stores';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-delivery-zone',
  templateUrl: './delivery-zone.component.html',
  styleUrl: './delivery-zone.component.scss',
})
export class DeliveryZoneComponent implements OnInit {
  form: FormGroup;
  zoneTypes = zoneTypeOptions;
  availableStores: StoreLookupDto[];
  availableZones: DeliveryZoneDto[];
  selectedZone: DeliveryZoneDto;
  zoneAreaSelectors = zoneAreaSelectorOptions;
  drawnCoordinates: { latitude: number; longitude: number; displayOrder: number }[] = [];
  zoneCoordinates: DeliveryZoneCoordinateDto[] = [];
  protected readonly ZoneAreaSelector = ZoneAreaSelector;
  readonly emptyGuid = '00000000-0000-0000-0000-000000000000';
  drawOnMapEnabled: boolean = false;
  @Output() zoneSaved = new EventEmitter<void>();
  showUploader: boolean = true;
  errorReportUrl: string | null = null;
  numberOfImportedDeliveryZone = 0;
  importResponse: ImportDeliveryZoneResponseDto;
  selectedZoneAreaSelector: ZoneAreaSelector;
  private readonly downloadFileLocation = 'assets/templates/Delivery_Zone_Import_Template.xlsx';
  private readonly downloadImportFileName = 'Delivery_Zone_Import_Template.xlsx';

  constructor(
    private deliveryZoneService: DeliveryZoneService,
    private storeService: StoreService,
    private fb: FormBuilder,
    private toaster: ToasterService,
    private confirmation: ConfirmationService,
    private cdr: ChangeDetectorRef,
    public dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.getAvailableStores();
    this.getAllZones();
  }

  buildForm() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [null],
      zoneType: [null, Validators.required],
      zipCode: [null],
      isAutoTransfer: [false],
      storeId: [null],
      deliveryFee: [0],
      within2HrDeliveryFee: [0],
      within3HrDeliveryFee: [0],
      within4HrDeliveryFee: [0],
      expressDeliveryFee: [0],
      sundayDeliveryFee: [0],
      weddingDayDeliveryFee: [0],
      futureDeliveryFee: [0],
      futureWithin2HrDeliveryFee: [0],
      futureWithin3HrDeliveryFee: [0],
      futureWithin4HrDeliveryFee: [0],
      salesTax: [0],
      zoneAreaSelector: [null, Validators.required],
      deliveryZoneCoordinates: this.fb.array([]),
    });
  }

  getAvailableStores() {
    this.storeService.getStoreLookup().subscribe(response => {
      this.availableStores = response.items;
    });
  }

  onCoordinatesChange(
    newCoordinates: { latitude: number; longitude: number; displayOrder: number }[],
  ): void {
    this.drawnCoordinates = newCoordinates;
  }

  save() {
    if (this.form.invalid) {
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }

    const requestData = {
      ...this.form.value,
    };
    if (requestData.zoneAreaSelector === ZoneAreaSelector.ZipCode) requestData.coordinates = [];
    else if (requestData.zoneAreaSelector === ZoneAreaSelector.Coordinates) {
      requestData.zipCode = null;
      requestData.coordinates = requestData.deliveryZoneCoordinates;
    } else {
      requestData.zipCode = null;
      requestData.coordinates = this.drawnCoordinates;
    }

    const request = this.deliveryZoneService.update(this.selectedZone.id, requestData);
    request.subscribe({
      next: () => {
        this.getAllZones();
        this.toaster.success('::DeliveryZoneSavedSuccessfully');
        this.drawOnMapEnabled = false;
        this.zoneSaved.emit();
      },
      error: err => {
        this.toaster.error('::DeliveryZoneSaveError');
      },
    });
  }

  getAllZones() {
    this.deliveryZoneService.getDeliveryZoneList().subscribe(response => {
      this.availableZones = response;
      if (response.length > 0 && !this.selectedZone) this.updateSelectedZone(response[0]);
    });
  }

  updateSelectedZone(deliveryZoneDto: DeliveryZoneDto) {
    this.selectedZone = deliveryZoneDto;
    this.form.patchValue(this.selectedZone);
    this.updateZoneAreaSelector();
    this.setValidatorsBasedOnSelectedZone();
  }

  setValidatorsBasedOnSelectedZone() {
    if (this.selectedZone) {
      if (this.selectedZone.deliveryZoneCoordinates.length <= 0) {
        this.form.get('zoneAreaSelector')?.setValue(ZoneAreaSelector.ZipCode);
        this.form.get('zipCode').setValidators([Validators.required]);
        this.selectedZoneAreaSelector = ZoneAreaSelector.ZipCode;
      } else {
        this.coordinates.controls.forEach(group => {
          this.form.get('zoneAreaSelector')?.setValue(ZoneAreaSelector.Coordinates);
          group.get('latitude').setValidators([Validators.required]);
          group.get('longitude').setValidators([Validators.required]);
          group.get('displayOrder').setValidators([Validators.required]);
        });
        this.selectedZoneAreaSelector = ZoneAreaSelector.Coordinates;
      }
      this.form.updateValueAndValidity();
    }
  }

  onZoneChange(event: any): void {
    this.form.reset();
    this.clearAllValidators();
    this.updateSelectedZone(this.availableZones.find(x => x.id == event.value));
    this.cdr.detectChanges();
  }

  clearAllValidators() {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control.clearValidators();
      control.updateValueAndValidity();
    });

    this.coordinates.controls.forEach(group => {
      if (group instanceof FormGroup) {
        Object.keys(group.controls).forEach(key => {
          const control = group.get(key);
          control.clearValidators();
          control.updateValueAndValidity();
        });
      }
    });
  }

  deleteZone() {
    this.confirmation.warn('::AreYouSureToDelete', '::AreYouSure').subscribe(status => {
      if (status === Confirmation.Status.confirm) {
        const request = this.deliveryZoneService.delete(this.selectedZone.id);
        request.subscribe({
          next: () => {
            this.selectedZone = null;
            this.getAllZones();
            this.toaster.success('::DeliveryZoneDeletedSuccessfully');
          },
          error: err => {
            this.toaster.error('::DeliveryZoneDeleteError');
          },
        });
      }
    });
  }

  onZoneAreaSelectorChange(event) {
    if (event.value === ZoneAreaSelector.Coordinates) {
      this.form.get('zipCode')?.clearValidators();
      this.selectedZone.deliveryZoneCoordinates.length > 0
        ? this.updateCoordinates()
        : this.addCoordinates();
      this.drawOnMapEnabled = false;
    } else if (event.value === ZoneAreaSelector.ZipCode) {
      this.coordinates.clear();
      this.form.get('zipCode')?.setValidators([Validators.required]);
      this.drawOnMapEnabled = false;
    } else {
      this.coordinates.clear();
      this.form.get('zipCode')?.clearValidators();
      this.drawOnMapEnabled = true;
    }
    this.form.get('zipCode')?.updateValueAndValidity();
    this.cdr.detectChanges();
  }

  get coordinates(): FormArray {
    return this.form.get('deliveryZoneCoordinates') as FormArray;
  }

  addCoordinate() {
    this.coordinates.push(
      this.fb.group({
        latitude: [0, Validators.required],
        longitude: [0, Validators.required],
        displayOrder: [this.coordinates.length + 1, Validators.required],
        id: [this.emptyGuid],
      }),
    );
    this.cdr.detectChanges();
  }

  updateCoordinate(coordinate: DeliveryZoneCoordinateDto) {
    this.coordinates.push(
      this.fb.group({
        latitude: [coordinate.latitude, Validators.required],
        longitude: [coordinate.longitude, Validators.required],
        displayOrder: [coordinate.displayOrder, Validators.required],
        id: [coordinate.id],
      }),
    );
  }

  removeCoordinate(index: number): void {
    this.coordinates.removeAt(index);
    this.updateDisplayOrders();
  }

  updateDisplayOrders(): void {
    this.coordinates.controls.forEach((group, index) => {
      group.get('displayOrder')?.setValue(index + 1);
    });
  }

  updateCoordinates() {
    if (this.selectedZone.deliveryZoneCoordinates.length) {
      this.selectedZone.deliveryZoneCoordinates.forEach(coord => this.updateCoordinate(coord));
    }
  }

  addCoordinates() {
    this.addCoordinate();
    this.addCoordinate();
    this.addCoordinate();
  }

  updateZoneAreaSelector(): void {
    this.removeCoordinates();
    this.updateCoordinates();
  }

  removeCoordinates(): void {
    while (this.coordinates.length !== 0) {
      this.coordinates.removeAt(0);
    }
  }

  clearForm(deliveryZoneDto: DeliveryZoneDto): void {
    this.form.reset();
    this.clearAllValidators();
    this.updateSelectedZone(deliveryZoneDto);
    this.cdr.detectChanges();
  }

  generateMap() {
    this.zoneCoordinates = this.form.get('deliveryZoneCoordinates').value;
  }

  isDeletedProgrammatically(event: boolean) {
    if (event) this.removeCoordinates();
  }

  downloadTemplate(): void {
    const link = document.createElement('a');
    link.href = this.downloadFileLocation;
    link.download = this.downloadImportFileName;
    link.click();
  }

  openImportDialog(templateRef: TemplateRef<any>) {
    const dialogRef = this.dialog.open(templateRef, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe(() => {
      this.getAllZones();
      this.resetDialogState();
    });
  }

  private resetDialogState(): void {
    this.showUploader = true;
    this.numberOfImportedDeliveryZone = 0;
    this.errorReportUrl = null;
    this.importResponse = null;
  }

  importCompleted(response: ImportDeliveryZoneResponseDto) {
    this.showUploader = false;
    this.importResponse = response;
    this.numberOfImportedDeliveryZone = this.importResponse.processedCount;
    this.importResponse && (this.importResponse.failedCount > 0 || this.importResponse.errorMessage)
      ? this.generateErrorReport()
      : (this.errorReportUrl = null);
  }

  generateErrorReport(): void {
    const formattedErrors = this.formatErrors();

    let errorHtml = `
      <html>
        <head>
          <title>Import Error Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              background-color: #f9f9f9;
            }
            h3 {
              color: #d9534f;
              border-bottom: 2px solid #d9534f;
              padding-bottom: 10px;
            }
            ul {
              list-style-type: none;
              padding: 0;
              margin: 0;
            }
            li {
              margin-bottom: 10px;
            }
            .row-header {
              font-weight: bold;
              margin-top: 15px;
              color: #0275d8;
              font-size: 1.2em;
            }
            .error-item {
              margin-left: 20px;
              color: #d9534f;
              font-style: italic;
              margin-top: 5px;
            }
            .container {
              background-color: white;
              padding: 20px;
              border-radius: 5px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .row-container {
              border-left: 4px solid #0275d8;
              padding-left: 10px;
              margin-bottom: 15px;
            }
            .error-container {
              border-left: 4px solid #d9534f;
              padding-left: 10px;
              margin-top: 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h3>Import Errors:</h3>
            <ul>
              ${formattedErrors}
            </ul>
          </div>
        </body>
      </html>
    `;
    const blob = new Blob([errorHtml], { type: 'text/html' });
    this.errorReportUrl = window.URL.createObjectURL(blob);
  }

  formatErrors(): string {
    if (
      (!this.importResponse || !this.importResponse.failedCount) &&
      !this.importResponse.errorMessage
    )
      return '';

    const rowErrorMap: { [key: string]: string[] } = {};

    this.importResponse.failedDeliveryZones.forEach(failedDelivery => {
      let rowNo = failedDelivery.rowNo;

      if (!rowErrorMap[rowNo]) {
        rowErrorMap[rowNo] = [];
      }
      rowErrorMap[rowNo].push(failedDelivery.errorMessage);
    });

    if (this.importResponse.errorMessage) {
      return `<div class="row-container"><li class="row-header">Error: ${this.importResponse.errorMessage}</li></div>`;
    }

    return Object.keys(rowErrorMap)
      .map(row => {
        const errors = rowErrorMap[row]
          .map(err => `<div class="error-container"><li class="error-item">${err}</li></div>`)
          .join('');

        return `<div class="row-container"><li class="row-header">Row No: ${row}</li><ul>Error: ${errors}</ul></div>`;
      })
      .join('');
  }
}
