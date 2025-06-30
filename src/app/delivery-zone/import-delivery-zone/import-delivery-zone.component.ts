import { Component, EventEmitter, Output } from '@angular/core';
import { ToasterService } from '@abp/ng.theme.shared';
import { DeliveryZoneService, ImportDeliveryZoneResponseDto } from '@proxy/deliveries';

@Component({
  selector: 'app-import-delivery-zone',
  templateUrl: './import-delivery-zone.component.html',
  styleUrl: './import-delivery-zone.component.scss',
})
export class ImportDeliveryZoneComponent {
  @Output() importCompletedEvent = new EventEmitter<ImportDeliveryZoneResponseDto>();
  isUploading: boolean = false;
  file: File;
  fileName: string;

  constructor(
    private readonly toaster: ToasterService,
    private deliveryZoneService: DeliveryZoneService,
  ) {}

  onFileChange(evt: any) {
    const target: DataTransfer = <DataTransfer>evt.target;

    if (target.files.length !== 1) {
      this.toaster.error('::ErrorDeliveryZoneUpload');
      return;
    }

    this.file = target.files[0];
    this.fileName = this.file.name.toLowerCase();
    const validExtensions = ['xlsx', 'xls'];
    const fileExtension = this.fileName.split('.').pop();

    if (!validExtensions.includes(fileExtension)) {
      this.toaster.error('::ImportFileFormatError');
      return;
    }
  }

  importDeliveryZone() {
    if (!this.file) {
      this.toaster.error('::EmptyImportFile');
      return;
    }

    const myFormData = new FormData();
    myFormData.append('file', this.file);
    this.isUploading = true;
    this.deliveryZoneService.importDeliveryZone(myFormData).subscribe(
      response => {
        this.importCompletedEvent.emit(response);
        this.isUploading = false;
      },
      () => {
        this.toaster.error('::ErrorDeliveryZoneUpload');
        this.isUploading = false;
      },
    );
  }
}
