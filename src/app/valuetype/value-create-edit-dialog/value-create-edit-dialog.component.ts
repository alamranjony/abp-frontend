import { Component, Inject } from '@angular/core';
import { LocalizationService } from '@abp/ng.core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToasterService } from '@abp/ng.theme.shared';

@Component({
  selector: 'app-value-create-edit-dialog',
  templateUrl: './value-create-edit-dialog.component.html',
  styleUrl: './value-create-edit-dialog.component.scss',
})
export class ValueCreateEditDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ValueCreateEditDialogComponent>,
    public abpLocalization: LocalizationService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toaster: ToasterService,
  ) {
    this.buildForm();
  }

  onSave(): void {
    if (this.form.invalid) {
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }

    const formData = this.form.value;
    formData.description = formData.description?.trim() || null;
    this.dialogRef.close(formData);
  }

  onClose(): void {
    this.dialogRef.close();
  }

  buildForm() {
    this.form = this.fb.group({
      name: [this.data.name || '', Validators.required],
      displayOrder: [this.data.displayOrder || 0],
      description: [this.data.description || null],
      isPreSelect: [this.data.isPreSelect || false],
      tenantId: [this.data.tenantId || ''],
      valueTypeId: [this.data.valueTypeId || null],
    });
  }
}
