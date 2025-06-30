import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MessageShortcutDialogData } from './message-shortcut-dialog-data.interface';
import { ToasterService } from '@abp/ng.theme.shared';

@Component({
  selector: 'app-message-shortcut-dialog',
  templateUrl: './message-shortcut-dialog.component.html',
  styleUrl: './message-shortcut-dialog.component.scss',
})
export class MessageShortcutDialogComponent {
  form: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<MessageShortcutDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MessageShortcutDialogData,
    private fb: FormBuilder,
    private toaster: ToasterService,
  ) {
    this.form = this.fb.group({
      shortCut: [this.data.shortCut || '', Validators.required],
      description: [this.data.description || '', Validators.required],
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

  onCancel(): void {
    this.dialogRef.close();
  }
}
