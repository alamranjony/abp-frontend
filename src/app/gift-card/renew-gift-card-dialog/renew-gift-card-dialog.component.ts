import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ToasterService } from '@abp/ng.theme.shared';

@Component({
  selector: 'app-renew-gift-card-dialog',
  templateUrl: './renew-gift-card-dialog.component.html',
})
export class RenewGiftCardDialogComponent {
  renewForm: FormGroup;
  minDate: Date;

  constructor(
    public dialogRef: MatDialogRef<RenewGiftCardDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private toaster: ToasterService,
  ) {
    this.minDate = new Date();
    this.renewForm = this.fb.group({
      extendedTillDate: [null, Validators.required],
      renewalAmount: [null, Validators.required],
    });
  }

  saveRenewal() {
    if (this.renewForm.invalid) {
      this.renewForm.markAllAsTouched();
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }

    this.dialogRef.close(this.renewForm.value);
  }

  close() {
    this.dialogRef.close();
  }
}
