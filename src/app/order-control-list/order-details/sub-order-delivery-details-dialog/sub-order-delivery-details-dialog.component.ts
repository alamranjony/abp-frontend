import { ToasterService } from '@abp/ng.theme.shared';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SubOrderService, UpdateSubOrderStatusDto } from '@proxy/orders';
import { Subject, takeUntil } from 'rxjs';
import { SharedModule } from 'src/app/shared/shared.module';

@Component({
  selector: 'app-sub-order-delivery-details-dialog',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './sub-order-delivery-details-dialog.component.html',
  styleUrl: './sub-order-delivery-details-dialog.component.scss',
})
export class SubOrderDeliveryDetailsDialogComponent implements OnInit, OnDestroy {
  destroy$ = new Subject<void>();
  deliveryForm: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<SubOrderDeliveryDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: { subOrderIds: string[]; orderId: string },
    private toasterService: ToasterService,
    private subOrderService: SubOrderService,
    private fb: FormBuilder,
  ) {}

  ngOnInit() {
    this.initializeForm();
  }

  private initializeForm() {
    this.deliveryForm = this.fb.group({
      deliveredDate: [new Date(), Validators.required],
      pickUpPerson: [null],
    });
  }

  onConfirm(): void {
    if (this.deliveryForm.valid) {
      const subOrderDetailsDto: UpdateSubOrderStatusDto = {
        subOrderIds: this.data.subOrderIds,
        deliveredDate: new Date(this.deliveryForm.value.deliveredDate).toDateString(),
        pickUpPerson: this.deliveryForm.value.pickUpPerson,
      };

      this.subOrderService
        .updateSubOrdersStatus(subOrderDetailsDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toasterService.success('::OrderDetails:MarkAsDeliveredSuccess');
            this.dialogRef.close({ updatedSubOrderIds: this.data.subOrderIds });
          },
          error: () => {
            this.toasterService.error('::OrderDetails:MarkAsDeliveredError');
            this.dialogRef.close();
          },
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
