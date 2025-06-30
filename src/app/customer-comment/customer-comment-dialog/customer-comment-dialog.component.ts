import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SharedModule } from '../../shared/shared.module';
import { ToasterService } from '@abp/ng.theme.shared';

@Component({
  selector: 'app-customer-comment-dialog',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './customer-comment-dialog.component.html',
  styleUrl: './customer-comment-dialog.component.scss',
})
export class CustomerCommentDialogComponent implements OnInit {
  form: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<CustomerCommentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toaster: ToasterService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      comment: [this.data.comment || '', Validators.required],
      commentAsLocationNote: [this.data.commentAsLocationNote || false],
      customerId: [this.data.customerId],
    });
  }

  onSave(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    } else {
      this.form.markAllAsTouched();
      this.toaster.error('::ValidationError:InvalidFormOrData');
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
