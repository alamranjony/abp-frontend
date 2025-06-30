import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DeliverySlotService } from '@proxy/deliveries';
import { ToasterService } from '@abp/ng.theme.shared';

@Component({
  selector: 'app-add-delivery-slot-dialog',
  templateUrl: './delivery-slot-dialog.component.html',
})
export class DeliverySlotDialogComponent {
  form: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<DeliverySlotDialogComponent>,
    private fb: FormBuilder,
    private deliverySlotService: DeliverySlotService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toaster: ToasterService,
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      deliveryModeId: [this.data?.deliveryModeId, Validators.required],
    });
  }

  save() {
    if (this.form.invalid) {
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }
    this.deliverySlotService.create(this.form.value).subscribe(createdSlot => {
      this.dialogRef.close({ success: true, slot: createdSlot });
    });
  }

  close() {
    this.dialogRef.close();
  }
}
