import { ToasterService } from '@abp/ng.theme.shared';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PaymentTransactionCodeService } from '@proxy/payment-transaction-codes';
import { paymentTransactionCodeCategoryOptions } from '@proxy/transactions/payment-transaction-code-category.enum';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-create-update-transaction-type-dialog',
  templateUrl: './create-update-transaction-type-dialog.component.html',
  styleUrls: ['./create-update-transaction-type-dialog.component.scss'],
})
export class CreateUpdateTransactionTypeDialogComponent implements OnInit, OnDestroy {
  form: FormGroup;
  destroy$: Subject<void> = new Subject();
  paymentTransactionCodeCategoryOptions = paymentTransactionCodeCategoryOptions;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CreateUpdateTransactionTypeDialogComponent>,
    private paymentTransactionCodeService: PaymentTransactionCodeService,
    private toasterService: ToasterService,
    @Inject(MAT_DIALOG_DATA) private data: any,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    if (this.data?.transactionCodeId) {
      this.getTransactionCodeById();
    }
  }

  buildForm() {
    this.form = this.fb.group({
      transactionCode: [null, Validators.required],
      title: [null, Validators.required],
      isActive: [false, Validators.required],
      paymentTransactionCodeCategory: [null, Validators.required],
    });
  }

  getTransactionCodeById(): void {
    this.paymentTransactionCodeService
      .get(this.data.transactionCodeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.form.patchValue(res);
          this.form.get('transactionCode')?.disable();
          this.form.get('paymentTransactionCodeCategory')?.disable();
        },
      });
  }

  onSave(): void {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      this.toasterService.error('::ValidationError:InvalidFormOrData');
      return;
    }

    if (this.data?.transactionCodeId) {
      this.updateTransactionTypeCode();
    } else {
      this.createTransactionTypeCode();
    }
  }

  private updateTransactionTypeCode(): void {
    this.paymentTransactionCodeService
      .update(this.data.transactionCodeId, this.form.getRawValue())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toasterService.success('::PaymentTransactionCode:SuccessfullUpdateMessage');
          this.dialogRef.close({ success: true });
        },
        error: () => {
          this.toasterService.error('::PaymentTransactionCode:ErrorUpdateMessage');
        },
      });
  }

  private createTransactionTypeCode(): void {
    this.paymentTransactionCodeService
      .create(this.form.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.dialogRef.close({ success: true });
          this.toasterService.success('::PaymentTransactionCode:SuccessfullCreateMessage');
        },
        error: () => {
          this.toasterService.error('::PaymentTransactionCode:ErrorCreateMessage');
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
