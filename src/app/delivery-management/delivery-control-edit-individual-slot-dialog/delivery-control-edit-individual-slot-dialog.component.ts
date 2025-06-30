import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DeliverySlotDto } from '@proxy/deliveries';

@Component({
  selector: 'app-delivery-control-edit-individual-slot-dialog',
  templateUrl: './delivery-control-edit-individual-slot-dialog.component.html',
  styleUrl: './delivery-control-edit-individual-slot-dialog.component.scss',
})
export class DeliveryControlEditIndividualSlotDialogComponent implements OnInit {
  slotChangeForm: FormGroup;
  availableSlots: DeliverySlotDto[];

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      currentSlotId: string;
      availableSlots: DeliverySlotDto[];
      slotSubOrderMapId: string;
    },
    private readonly dialogRef: MatDialogRef<DeliveryControlEditIndividualSlotDialogComponent>,
    private readonly fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.availableSlots = this.data.availableSlots;
    this.slotChangeForm = this.fb.group({
      slotControl: [this.data.currentSlotId],
    });
  }

  save(): void {
    this.dialogRef.close({
      slotSubOrderMapId: this.data.slotSubOrderMapId,
      newSlotId: this.slotChangeForm.get('slotControl').value,
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
