import { Component, Inject, OnInit } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToasterService } from '@abp/ng.theme.shared';

@Component({
  selector: 'app-email-directory-dialog',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './email-directory-dialog.component.html',
  styleUrl: './email-directory-dialog.component.scss',
})
export class EmailDirectoryDialogComponent implements OnInit {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EmailDirectoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toaster: ToasterService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      email: [this.data.email || '', [Validators.required, Validators.email]],
      isPrimary: [this.data.isPrimary || false],
      optForDirectMarketing: [this.data.optForDirectMarketing || false],
      optOutForMarketing: [this.data.optOutForMarketing || false],
      entityId: [this.data.entityId || null],
      entityName: [this.data.entityName || null],
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
