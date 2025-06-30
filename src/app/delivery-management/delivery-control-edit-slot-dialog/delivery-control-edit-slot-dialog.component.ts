import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DeliverySlotDto, DeliverySlotService } from '@proxy/deliveries';
import { DeliveryControlService, DeliverySlotSubOrderMapDto } from '@proxy/delivery-management';
import { DeliveryControlEditIndividualSlotDialogComponent } from '../delivery-control-edit-individual-slot-dialog/delivery-control-edit-individual-slot-dialog.component';
import { Subject, takeUntil } from 'rxjs';
import { SubOrderDeliveryStatus } from '@proxy/orders';

@Component({
  selector: 'app-delivery-control-edit-slot-dialog',
  templateUrl: './delivery-control-edit-slot-dialog.component.html',
  styleUrl: './delivery-control-edit-slot-dialog.component.scss',
})
export class DeliveryControlEditSlotDialogComponent implements OnInit, OnDestroy {
  deliverySlotSubOrderMapDtos: DeliverySlotSubOrderMapDto[] = [];
  deliverySlots: DeliverySlotDto[] = [];
  columns: string[] = ['orderId', 'slot', 'actions'];
  destroy$: Subject<void> = new Subject();
  deliveryModeId: string;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      selectedSlots: string[];
      selectedDate: string;
      deliveryModeId: string;
    },
    private readonly deliveryControlService: DeliveryControlService,
    private readonly deliverySlotService: DeliverySlotService,
    public dialog: MatDialog,
    private dialogRef: MatDialogRef<DeliveryControlEditSlotDialogComponent>,
  ) {
    this.deliveryModeId = data.deliveryModeId;
  }

  ngOnInit(): void {
    this.getDeliverySlots();
    this.fetchSubOrders();
  }

  fetchSubOrders(): void {
    this.deliveryControlService
      .getSubOrdersBySlotIdsAndDate(
        this.data.selectedSlots,
        this.data.selectedDate,
        SubOrderDeliveryStatus.ToBeDelivered,
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.deliverySlotSubOrderMapDtos = result;
      });
  }

  getDeliverySlots(): void {
    this.deliverySlotService
      .getDeliverySlots(this.deliveryModeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(slots => {
        this.deliverySlots = slots;
      });
  }

  editDeliverySlot(subOrderId: string): void {
    const selectedSlotSubOrderMap = this.deliverySlotSubOrderMapDtos.find(
      subOrder => subOrder.subOrderId === subOrderId,
    );

    if (!selectedSlotSubOrderMap) {
      return;
    }

    const dialogRef = this.dialog.open(DeliveryControlEditIndividualSlotDialogComponent, {
      width: '800px',
      data: {
        currentSlotId: selectedSlotSubOrderMap?.slotId,
        availableSlots: this.deliverySlots,
        slotSubOrderMapId: selectedSlotSubOrderMap.id,
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.deliveryControlService
            .updateDeliverySlot(subOrderId, result.newSlotId)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
              this.fetchSubOrders();
            });
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
