import { ToasterService } from '@abp/ng.theme.shared';
import { Component, Inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DeliveryControlService } from '@proxy/delivery-management';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-delivery-control-bulk-date-change',
  templateUrl: './delivery-control-bulk-date-change.component.html',
  styleUrl: './delivery-control-bulk-date-change.component.scss',
})
export class DeliveryControlBulkDateChangeComponent implements OnDestroy {
  dateForm: FormGroup;
  minDate: Date;
  newDate: string;
  destroy$: Subject<void> = new Subject();

  constructor(
    public dialogRef: MatDialogRef<DeliveryControlBulkDateChangeComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      selectedSlots: string[];
      selectedDate: string;
      storeId: string;
    },
    private readonly fb: FormBuilder,
    private readonly deliveryControlService: DeliveryControlService,
    private toaster: ToasterService,
  ) {
    this.minDate = new Date();
    this.dateForm = this.fb.group({
      newDeliveryDate: [null, Validators.required],
    });
  }

  save() {
    if (this.dateForm.invalid) {
      this.dateForm.markAllAsTouched();
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }

    this.newDate = this.dateForm.get('newDeliveryDate').value.toLocaleDateString();
    this.deliveryControlService
      .bulkUpdateDeliveryDate(this.data.selectedDate, this.newDate, this.data.selectedSlots)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.dialogRef.close(true);
      });
  }

  close() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
