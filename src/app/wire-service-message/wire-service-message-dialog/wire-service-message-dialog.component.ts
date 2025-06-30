import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  BloomNetMessageType,
  DateType,
  dateTypeOptions,
  FSNMessageType,
  FTDMessageType,
  MasDirectMessageType,
  TelefloraMessageType,
  WireServiceMessageDto,
} from '@proxy/wire-services/wire-service-messages';
import { WireService, wireServiceOptions } from '@proxy/common';
import { MatSelectChange } from '@angular/material/select';
import { ShopDto, ShopService } from '@proxy/shops';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject, take, takeUntil } from 'rxjs';
import { ToasterService } from '@abp/ng.theme.shared';
import { ListService } from '@abp/ng.core';

@Component({
  selector: 'app-wire-service-message-dialog',
  templateUrl: './wire-service-message-dialog.component.html',
  styleUrl: './wire-service-message-dialog.component.scss',
})
export class WireServiceMessageDialogComponent implements OnInit, OnDestroy {
  form: FormGroup;
  shops: ShopDto[] = [];
  selectedWireService: number = 0;
  dataSource = new MatTableDataSource<string>();
  selection = new SelectionModel<string>(true, []);
  displayedColumns: string[] = ['select', 'item'];
  messageTypes = [] as { key: string; value: string }[];
  hasShopSelectionError: boolean = false;
  protected readonly wireServiceOptions = wireServiceOptions;
  protected readonly dateTypeOptions = dateTypeOptions;
  private destroy$ = new Subject<void>();

  constructor(
    public readonly list: ListService,
    private dialogRef: MatDialogRef<WireServiceMessageDialogComponent>,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: WireServiceMessageDto,
    private shopService: ShopService,
    private toaster: ToasterService,
  ) {}

  get someSelected(): boolean {
    return this.dataSource.filteredData.some(row => this.selection.isSelected(row));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.buildForm();
    this.dataSource.filterPredicate = (data: string, filter: string) => {
      return data.toLowerCase().includes(filter.toLowerCase());
    };
    this.loadData();
  }

  onSave(): void {
    if (this.selection.selected.length === 0) {
      this.hasShopSelectionError = true;
      this.form.markAsDirty();
    } else {
      this.hasShopSelectionError = false;
    }

    if (!this.form.valid) {
      this.form.markAllAsTouched();
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }

    const { storeId, fromDate, toDate, ...formValues } = this.form.value;
    const result = {
      ...formValues,
      fromDate: new Date(fromDate).toLocaleDateString(),
      toDate: new Date(toDate).toLocaleDateString(),
      shopCodes: this.selection.selected,
      ...(storeId ? { storeId } : {}),
    };

    this.dialogRef.close(result);
  }

  onClose(): void {
    this.dialogRef.close();
  }

  toggleAll() {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.dataSource.data.forEach(row => this.selection.select(row));
    }
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  onWireServiceChange(event: MatSelectChange) {
    this.selectedWireService = event.value;
    if (!this.selectedWireService) return;
    this.loadMessageType();
    this.loadWireServiceShops();
  }

  applyFilter(event: Event) {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim();
  }

  private buildForm() {
    this.form = this.fb.group({
      wireService: [this.data?.wireService || 0, Validators.required],
      messageType: [this.data?.messageType || 0, Validators.required],
      fromDate: [this.data?.fromDate || null, Validators.required],
      toDate: [this.data?.toDate || null, Validators.required],
      dateType: [this.data?.dateType || DateType.OrderDate, Validators.required],
      minAmount: [this.data?.minAmount || 0, Validators.required],
      maxAmount: [this.data?.maxAmount || 0, Validators.required],
      message: [this.data?.message || null, Validators.required],
      storeId: [this.data?.storeId || null],
      applyForAllStore: [false],
    });
  }

  private loadData() {
    if (!this.data) {
      return;
    }
    this.selectedWireService = this.data.wireService;
    this.loadMessageType();
    this.loadWireServiceShops();
  }

  private loadWireServiceShops() {
    this.list
      .hookToQuery(query =>
        this.shopService
          .getShopsByWireService({
            ...query,
            filter: this.dataSource.filter,
            wireServiceId: this.selectedWireService,
          })
          .pipe(take(1), takeUntil(this.destroy$)),
      )
      .subscribe(response => {
        this.dataSource.data = response.items.map(e => e.shopCode);
        this.dataSource.filter = '';
        this.selection.clear();

        if (this.data?.shopCodes) {
          const shopCodes = this.data.shopCodes;
          const validSelections = shopCodes.filter((code: string) =>
            this.dataSource.data.includes(code),
          );
          this.selection.select(...validSelections);
        }
      });
  }

  private loadMessageType() {
    const messageTypeMap = {
      [WireService.Bloomnet]: BloomNetMessageType,
      [WireService.MasDirect]: MasDirectMessageType,
      [WireService.Teleflora]: TelefloraMessageType,
      [WireService.FSN]: FSNMessageType,
      [WireService.FTD]: FTDMessageType,
    };

    const messageTypeEnum = messageTypeMap[this.selectedWireService];
    this.messageTypes = messageTypeEnum
      ? Object.keys(messageTypeEnum)
          .filter(key => isNaN(Number(key)))
          .map(key => ({ key, value: messageTypeEnum[key] }))
      : [];
  }
}
