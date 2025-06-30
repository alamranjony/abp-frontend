import { Component, Inject, OnInit } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToasterService } from '@abp/ng.theme.shared';

@Component({
  selector: 'app-phone-directory-dialog',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './phone-directory-dialog.component.html',
  styleUrl: './phone-directory-dialog.component.scss',
})
export class PhoneDirectoryDialogComponent implements OnInit {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<PhoneDirectoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toaster: ToasterService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      phoneNumber: [
        this.data.phoneNumber || '',
        [Validators.required, this.phoneNumberValidator()],
      ],
      isPrimary: [this.data.isPrimary || false],
      isAcceptTextMessage: [this.data.isAcceptTextMessage || false],
      entityId: [this.data.entityId || null],
      entityName: [this.data.entityName || null],
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

  private phoneNumberValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const isValid = /^\+?\d{10,15}$/.test(control.value);
      return isValid ? null : { invalidPhoneNumber: true };
    };
  }
}
