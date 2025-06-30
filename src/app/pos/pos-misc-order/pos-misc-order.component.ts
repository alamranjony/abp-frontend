import { PagedResultDto } from '@abp/ng.core';
import { ToasterService } from '@abp/ng.theme.shared';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import {
  CreateUpdateMiscOrderDto,
  MiscOrderService,
  MiscOrderType,
  miscOrderTypeOptions,
} from '@proxy/misc-orders';
import { ValueTypeSettingService } from '@proxy/value-type-settings';
import { OrderSettingsDto } from '@proxy/value-type-settings/orders';
import { ValueDto, ValuePagedAndSortedResultRequestDto, ValueService } from '@proxy/values';
import { catchError, EMPTY, finalize, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { sortEnumValues } from 'src/app/shared/common-utils';
import { SharedModule } from 'src/app/shared/shared.module';

@Component({
  selector: 'app-pos-misc-order',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './pos-misc-order.component.html',
  styleUrl: './pos-misc-order.component.scss',
})
export class PosMiscOrderComponent implements OnInit, OnDestroy {
  miscOrderForm: FormGroup;
  miscOrderTypes = sortEnumValues(miscOrderTypeOptions);
  orderValueTypeSettings: OrderSettingsDto;
  miscReasons: ValueDto[] = [];
  loading = false;
  destroy$: Subject<void> = new Subject();

  constructor(
    private dialogRef: MatDialogRef<PosMiscOrderComponent>,
    private fb: FormBuilder,
    private valueTypeSettingService: ValueTypeSettingService,
    private valueService: ValueService,
    private toasterService: ToasterService,
    private miscOrderService: MiscOrderService,
    private toaster: ToasterService,
  ) {}

  ngOnInit(): void {
    this.createForm();
    this.loadMiscReasons();
  }

  onOrderTypeChange(selectedOrderType: MiscOrderType): void {
    const miscReasonTypeId =
      selectedOrderType === MiscOrderType.MiscIncome
        ? this.orderValueTypeSettings.miscIncomeReason
        : this.orderValueTypeSettings.paidOutReason;

    this.getValues(miscReasonTypeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.assignMiscReasons(response);
      });
  }

  onSubmit() {
    if (this.isFormInvalid()) return;

    const miscOrder: CreateUpdateMiscOrderDto = this.miscOrderForm.value;
    this.create(miscOrder);
  }

  private create(miscOrder: CreateUpdateMiscOrderDto): void {
    this.loading = true;
    this.miscOrderService
      .create(miscOrder)
      .pipe(
        tap({
          next: () => this.handleSuccess(),
          error: () => this.handleError(),
        }),
        finalize(() => (this.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe();
  }

  private handleSuccess() {
    this.toaster.success('::Pos:MiscOrder:SaveSuccessful');
    this.dialogRef.close();
  }

  private handleError() {
    this.toaster.error('::Pos:MiscOrder:SaveFailed');
  }

  private createForm(): void {
    this.miscOrderForm = this.fb.group({
      storeId: [''],
      employeeId: ['', Validators.required],
      pin: ['', Validators.required],
      orderTypeId: [MiscOrderType.MiscIncome, Validators.required],
      description: [''],
      reasonId: ['', Validators.required],
      amount: [0, Validators.required],
    });
  }

  private loadMiscReasons() {
    this.valueTypeSettingService
      .getOrderValueTypeSetting()
      .pipe(
        switchMap(response => {
          this.orderValueTypeSettings = response;
          const miscReasonTypeId = response.miscIncomeReason;
          return this.getValues(miscReasonTypeId);
        }),
        catchError(() => {
          return EMPTY;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe(response => {
        this.assignMiscReasons(response);
      });
  }

  private getValues(miscReasonTypeId: string) {
    return this.valueService.getList({
      valueTypeId: miscReasonTypeId,
    } as ValuePagedAndSortedResultRequestDto);
  }

  private assignMiscReasons(response: PagedResultDto<ValueDto>) {
    this.miscReasons = response.items;
    this.processPreSelection();
  }

  private processPreSelection(): void {
    const preselectedReason = this.miscReasons.find(e => e.isPreSelect);
    if (preselectedReason) {
      this.miscOrderForm.patchValue({ reasonId: preselectedReason.id });
    }
  }

  private isFormInvalid(): boolean {
    if (this.miscOrderForm.invalid) {
      this.miscOrderForm.markAllAsTouched();
      this.toasterService.error('::ValidationError:InvalidFormOrData');
      return true;
    }

    if (this.miscOrderForm.value.amount <= 0) {
      this.toasterService.error('::Pos:MiscOrder:AmountMustBeGreaterThanZero');
      return true;
    }
    return false;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
