import { ToasterService } from '@abp/ng.theme.shared';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ValueTypeSettingService } from '@proxy/value-type-settings';
import { OrderSettingsDto } from '@proxy/value-type-settings/orders';
import { ValueDto, ValueService } from '@proxy/values';
import { concatMap, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-order-replacement-reason-dialog',
  templateUrl: './order-replacement-reason-dialog.component.html',
  styleUrls: ['./order-replacement-reason-dialog.component.scss'],
})
export class OrderReplacementReasonDialogComponent implements OnInit, OnDestroy {
  selectedReasonId: string;
  replacementReasons: ValueDto[] = [];
  destroy$: Subject<void> = new Subject();
  additionalComment: string;

  constructor(
    public dialogRef: MatDialogRef<OrderReplacementReasonDialogComponent>,
    private valueTypeSettingsService: ValueTypeSettingService,
    private valueService: ValueService,
    private toaster: ToasterService,
  ) {}

  ngOnInit() {
    this.getReplacementReasons();
  }

  getReplacementReasons() {
    this.valueTypeSettingsService
      .getOrderValueTypeSetting()
      .pipe(
        takeUntil(this.destroy$),
        concatMap((orderSettingsDto: OrderSettingsDto) =>
          this.valueService.getValuesByValueTypeId(orderSettingsDto.replacementReason),
        ),
      )
      .subscribe(response => {
        this.replacementReasons = response;
      });
  }

  onSave(): void {
    if (!this.selectedReasonId) {
      this.toaster.error('::Order:ReplacementReasonNotSelected');
      return;
    }

    this.dialogRef.close({
      replacementReasonId: this.selectedReasonId,
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
