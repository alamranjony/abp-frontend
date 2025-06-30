import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ValueDto, ValueService } from '@proxy/values';
import { ValueTypeSettingService } from '@proxy/value-type-settings';
import { forkJoin, Subject, switchMap, takeUntil } from 'rxjs';
import {
  PrinterLookupDto,
  PrinterOverrideType,
  PrinterSetupDto,
  PrintJobType,
  printJobTypeOptions,
} from '@proxy/print-node';
import { EMPTY_GUID } from '../../shared/constants';
import { MatSelectChange } from '@angular/material/select';

@Component({
  selector: 'app-printer-setup-override-dialog',
  templateUrl: './printer-setup-override-dialog.component.html',
  styleUrl: './printer-setup-override-dialog.component.scss',
})
export class PrinterSetupOverrideDialogComponent implements OnInit, OnDestroy {
  form: FormGroup;
  orderTrays: string[] = [];
  threePanelCardTrays: string[] = [];
  fourPanelCardTrays: string[] = [];
  allInOneCardTrays: string[] = [];
  filteredValues: ValueDto[] = [];
  readonly printJobTypeOptions = printJobTypeOptions;
  readonly values: ValueDto[] = [];
  readonly PrinterOverrideType = PrinterOverrideType;
  readonly EMPTY_GUID = EMPTY_GUID;
  private destroy$: Subject<void> = new Subject<void>();
  private productDepartmentValueTypeId: string;
  private orderTypesForPrintingOverrideValueTypeId: string;

  constructor(
    private readonly fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      isEditMode: boolean;
      printers: PrinterLookupDto[];
      printerSetup?: PrinterSetupDto;
    },
    public dialogRef: MatDialogRef<PrinterSetupOverrideDialogComponent>,
    private readonly valueService: ValueService,
    private readonly valueTypeSettingService: ValueTypeSettingService,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.configureTrays();
    this.loadData();
    this.initializeTraysFromExistingPrinters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSave() {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.value);
  }

  onClose() {
    this.dialogRef.close();
  }

  onOverrideTypeChange(event: MatSelectChange) {
    const overrideType = event.value as PrinterOverrideType;
    this.filterValuesByOverrideType(overrideType);
  }

  private buildForm() {
    this.form = this.fb.group({
      id: [this.data.printerSetup?.id ?? EMPTY_GUID],
      printJobType: [
        this.data.printerSetup?.printJobType ?? PrintJobType.LocalOrder,
        Validators.required,
      ],
      printerOverrideType: [
        this.data.printerSetup?.printerOverrideType ?? PrinterOverrideType.ProductDepartment,
        Validators.required,
      ],
      valueId: [this.data.printerSetup?.valueId ?? null, Validators.required],
      orderPrinterId: [this.data.printerSetup?.orderPrinterId ?? EMPTY_GUID],
      orderTray: [this.data.printerSetup?.orderTray],
      threePanelCardPrinterId: [this.data.printerSetup?.threePanelCardPrinterId ?? EMPTY_GUID],
      threePanelCardTray: [this.data.printerSetup?.threePanelCardTray],
      fourPanelCardPrinterId: [this.data.printerSetup?.fourPanelCardPrinterId ?? EMPTY_GUID],
      fourPanelCardTray: [this.data.printerSetup?.fourPanelCardTray],
      allInOneCardPrinterId: [this.data.printerSetup?.allInOneCardPrinterId ?? EMPTY_GUID],
      allInOneCardTray: [this.data.printerSetup?.allInOneCardTray],
    });
  }

  private loadData() {
    this.valueTypeSettingService
      .getValueTypeSetting()
      .pipe(
        takeUntil(this.destroy$),
        switchMap(valueTypeSetting => {
          this.productDepartmentValueTypeId = valueTypeSetting.productSettings.department;
          this.orderTypesForPrintingOverrideValueTypeId =
            valueTypeSetting.orderSettings.orderTypesForPrintingOverride;

          return forkJoin([
            this.valueService.getValuesByValueTypeId(this.productDepartmentValueTypeId),
            this.valueService.getValuesByValueTypeId(this.orderTypesForPrintingOverrideValueTypeId),
          ]);
        }),
      )
      .subscribe(([departmentValues, orderTypeValues]) => {
        this.values.push(...departmentValues, ...orderTypeValues);
        const initialOverrideType = this.form.get('printerOverrideType')?.value;
        this.filterValuesByOverrideType(initialOverrideType);
      });
  }

  private filterValuesByOverrideType(printerOverrideType: PrinterOverrideType) {
    if (printerOverrideType === PrinterOverrideType.ProductDepartment) {
      this.filteredValues = this.values.filter(
        value => value.valueTypeId === this.productDepartmentValueTypeId,
      );
    }

    if (printerOverrideType === PrinterOverrideType.OrderType) {
      this.filteredValues = this.values.filter(
        value => value.valueTypeId === this.orderTypesForPrintingOverrideValueTypeId,
      );
    }
    this.form.get('valueId').setValue(this.filteredValues[0]?.id);
  }

  private configureTrays() {
    this.form
      .get('orderPrinterId')
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(id => {
        const printer = this.data?.printers.find(p => p.id === id);
        this.orderTrays = printer?.bins ?? [];
        this.form.get('orderTray').setValue(this.orderTrays[0]);
      });

    this.form
      .get('threePanelCardPrinterId')
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(id => {
        const printer = this.data?.printers.find(p => p.id === id);
        this.threePanelCardTrays = printer?.bins ?? [];
        this.form.get('threePanelCardTray').setValue(this.threePanelCardTrays[0]);
      });

    this.form
      .get('fourPanelCardPrinterId')
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(id => {
        const printer = this.data?.printers.find(p => p.id === id);
        this.fourPanelCardTrays = printer?.bins ?? [];
        this.form.get('fourPanelCardTray').setValue(this.fourPanelCardTrays[0]);
      });

    this.form
      .get('allInOneCardPrinterId')
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(id => {
        const printer = this.data?.printers.find(p => p.id === id);
        this.allInOneCardTrays = printer?.bins ?? [];
        this.form.get('allInOneCardTray').setValue(this.allInOneCardTrays[0]);
      });
  }

  private initializeTraysFromExistingPrinters() {
    const setup = this.data?.printerSetup;
    if (!setup) return;

    const orderPrinter = this.data.printers.find(p => p.id === setup.orderPrinterId);
    const threePanelPrinter = this.data.printers.find(p => p.id === setup.threePanelCardPrinterId);
    const fourPanelPrinter = this.data.printers.find(p => p.id === setup.fourPanelCardPrinterId);
    const allInOnePrinter = this.data.printers.find(p => p.id === setup.allInOneCardPrinterId);

    this.orderTrays = orderPrinter?.bins ?? [];
    this.threePanelCardTrays = threePanelPrinter?.bins ?? [];
    this.fourPanelCardTrays = fourPanelPrinter?.bins ?? [];
    this.allInOneCardTrays = allInOnePrinter?.bins ?? [];
  }
}
