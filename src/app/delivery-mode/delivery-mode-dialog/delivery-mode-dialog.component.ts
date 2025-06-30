import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  DeliveryModeService,
  CreateUpdateDeliveryModeDto,
  DeliveryModeDto,
} from '@proxy/deliveries';
import { ToasterService } from '@abp/ng.theme.shared';

@Component({
  selector: 'app-delivery-mode-dialog',
  templateUrl: './delivery-mode-dialog.component.html',
  styleUrls: ['./delivery-mode-dialog.component.scss'],
})
export class DeliveryModeDialogComponent {
  modeForm: FormGroup;
  isEditMode: boolean = false;
  dialogTitle = '::AddDeliveryMode';

  constructor(
    private fb: FormBuilder,
    private deliveryModeService: DeliveryModeService,
    private dialogRef: MatDialogRef<DeliveryModeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { mode: CreateUpdateDeliveryModeDto },
    private toaster: ToasterService,
  ) {
    this.isEditMode = !!data?.mode;
    this.dialogTitle = this.isEditMode ? '::EditDeliveryMode' : '::AddDeliveryMode';

    this.modeForm = this.fb.group({
      name: [data?.mode?.name || '', [Validators.required]],
    });
  }

  save() {
    if (this.modeForm.invalid) {
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }
    this.deliveryModeService.create(this.modeForm.value).subscribe((newMode: DeliveryModeDto) => {
      this.dialogRef.close(newMode);
    });
  }

  close() {
    this.dialogRef.close();
  }
}
