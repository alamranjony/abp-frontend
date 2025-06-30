import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ValueTypeSettingService } from '@proxy/value-type-settings';
import { OrderSettingsDto } from '@proxy/value-type-settings/orders';
import { ValueDto, ValueService } from '@proxy/values';
import { concatMap, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-pos-cancel-reason-dialog',
  templateUrl: './pos-cancel-reason-dialog.component.html',
  styleUrls: ['./pos-cancel-reason-dialog.component.scss'],
})
export class PosCancelReasonDialogComponent implements OnInit, OnDestroy {
  selectedReasonId: string;
  cancelReasons: ValueDto[] = [];
  destroy$: Subject<void> = new Subject();
  additionalComment: string;

  constructor(
    public dialogRef: MatDialogRef<PosCancelReasonDialogComponent>,
    private valueTypeSettingsService: ValueTypeSettingService,
    private valueService: ValueService,
  ) {}

  ngOnInit() {
    this.getCancellationReasons();
  }

  getCancellationReasons() {
    this.valueTypeSettingsService
      .getOrderValueTypeSetting()
      .pipe(
        takeUntil(this.destroy$),
        concatMap((orderSettingsDto: OrderSettingsDto) =>
          this.valueService.getValuesByValueTypeId(orderSettingsDto.cancelSaleReason),
        ),
      )
      .subscribe(response => {
        this.cancelReasons = response;
      });
  }

  onSave(): void {
    this.dialogRef.close({
      cancelReasonId: this.selectedReasonId,
      additionalComment: this.additionalComment,
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
