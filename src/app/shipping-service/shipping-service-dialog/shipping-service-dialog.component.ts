import { ToasterService } from '@abp/ng.theme.shared';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SharedModule } from 'src/app/shared/shared.module';

@Component({
  selector: 'app-shipping-service-dialog',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './shipping-service-dialog.component.html',
  styleUrl: './shipping-service-dialog.component.scss',
})
export class ShippingServiceDialogComponent implements OnInit {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ShippingServiceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toaster: ToasterService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: [this.data.name || '', Validators.required],
      status: [this.data.status ?? true],
    });
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }

    this.dialogRef.close(this.form.value);
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
