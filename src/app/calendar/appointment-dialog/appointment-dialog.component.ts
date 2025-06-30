import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DeliveryModeDto, DeliveryModeService } from '@proxy/deliveries';
import { ListService, PagedAndSortedResultRequestDto } from '@abp/ng.core';
import { AngularMaterialModule } from 'src/app/shared/angular-material/angular-material.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { ToasterService } from '@abp/ng.theme.shared';

@Component({
  selector: 'app-appointment-dialog',
  templateUrl: './appointment-dialog.component.html',
  styleUrls: ['./appointment-dialog.component.scss'],
  providers: [ListService],
  standalone: true,
  imports: [CommonModule, AngularMaterialModule, SharedModule],
})
export class AppointmentDialogComponent {
  appointmentForm: FormGroup;
  deliveryModes: DeliveryModeDto[] = [];

  constructor(
    public dialogRef: MatDialogRef<AppointmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      uuid: string;
      date: Date;
      deliveryModeName: string;
      endTime: Date;
      color: string;
      deliveryModeId: string;
    },
    private formBuilder: FormBuilder,
    private deliveryModeService: DeliveryModeService,
    public readonly list: ListService,
    private toaster: ToasterService,
  ) {
    this.appointmentForm = this.formBuilder.group({
      deliveryModeId: [this.data.deliveryModeId || '', Validators.required],
      date: [this.data.date, Validators.required],
      endTime: [null],
    });
    this.getAllDeliveryModes();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onSaveClick(): void {
    if (this.appointmentForm.invalid) {
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }

    const data = {
      deliveryModeId: this.appointmentForm.controls['deliveryModeId'].value,
      date: this.appointmentForm.controls['date'].value,
      endTime: this.appointmentForm.controls['endTime'].value,
      uuid: this.data.uuid,
    };
    this.dialogRef.close(data);
  }

  onDeleteClick(): void {
    this.dialogRef.close({ remove: true, uuid: this.data.uuid });
  }

  getAllDeliveryModes() {
    const deliveryModeStreamCreator = (query: PagedAndSortedResultRequestDto) =>
      this.deliveryModeService.getList({ ...query, maxResultCount: 100 });
    this.list.hookToQuery(deliveryModeStreamCreator).subscribe(response => {
      this.deliveryModes = response.items;
    });
  }
}
