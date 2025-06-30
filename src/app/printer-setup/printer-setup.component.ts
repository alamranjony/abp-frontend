import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import {
  PrinterLookupDto,
  PrinterSetupDto,
  PrinterSetupService,
  PrintingSettingDto,
  printJobTypeOptions,
  PrintNodeService,
} from '@proxy/print-node';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { EMPTY_GUID } from '../shared/constants';
import { ToasterService } from '@abp/ng.theme.shared';
import { ConfigStateService, CurrentTenantDto } from '@abp/ng.core';

@Component({
  selector: 'app-printer-setup',
  templateUrl: './printer-setup.component.html',
  styleUrl: './printer-setup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrinterSetupComponent implements OnInit, OnDestroy {
  form: FormGroup;
  printers: PrinterLookupDto[] = [];

  protected readonly printJobTypeOptions = printJobTypeOptions;
  private destroy$: Subject<void> = new Subject<void>();

  get jobTypes(): FormArray {
    return this.form.get('jobTypes') as FormArray;
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly printNodeService: PrintNodeService,
    private readonly printerSetupService: PrinterSetupService,
    private readonly toaster: ToasterService,
    private readonly configState: ConfigStateService,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSave() {
    if (!this.form.valid) {
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }
    const printerSetups: PrinterSetupDto[] = this.form.value.jobTypes.map((jobType: any) => ({
      id: jobType.id,
      printJobType: jobType.jobType,
      orderPrinterId: jobType.orderPrinterId,
      orderTray: jobType.orderTray,
      threePanelCardPrinterId: jobType.cardPrinter3Id,
      threePanelCardTray: jobType.cardTray3,
      fourPanelCardPrinterId: jobType.cardPrinter4Id,
      fourPanelCardTray: jobType.cardTray4,
      allInOneCardPrinterId: jobType.cardPrinterAllInOneId,
      allInOneCardTray: jobType.cardTrayAllInOne,
    }));

    const printingSetting: PrintingSettingDto = {
      isAutoPrintForReviewOrder: this.form.get('isAutoPrintForReviewOrder')?.value,
      isPrintCardMessageWithOrderCopy: this.form.get('isPrintCardMessageWithOrderCopy')?.value,
    };

    forkJoin({
      setups: this.printerSetupService.savePrinterSetupForCurrentStore(printerSetups),
      printingSetting: this.printerSetupService.savePrintingSettings(printingSetting),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ setups, printingSetting }) => {
          this.populateForm(printingSetting, setups);
          this.toaster.success('::PrinterSetup:SavedSuccessfully');
        },
        error: () => {
          this.toaster.error('::PrinterSetup:SaveFailed');
        },
      });
  }

  trackByIndex(index: number): number {
    return index;
  }

  getJobTypeLabel(value: number): string {
    return this.printJobTypeOptions.find(opt => opt.value === value)?.key ?? '';
  }

  onSync() {
    this.printerSetupService
      .syncComputersAndPrinters()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadData();
          this.toaster.success('::PrintNodeSetup:Sync:Completed');
        },
        error: () => {
          this.toaster.error('::PrintNodeSetup:Sync:SomethingWentWrong');
        },
      });
  }

  onCreatePrintNodeAccount(): void {
    const currentTenant = this.configState.getOne('currentTenant') as CurrentTenantDto;
    this.printNodeService
      .createPrintNodeChildAccountForTenant(currentTenant?.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toaster.success('::PrintNode:AccountCratedSuccessfully');
        },
      });
  }

  private buildForm() {
    this.form = this.fb.group({
      isAutoPrintForReviewOrder: [false],
      isPrintCardMessageWithOrderCopy: [false],
      jobTypes: this.fb.array(
        printJobTypeOptions.map(jobType => this.createRowGroup(jobType.value)),
      ),
    });
  }

  private createRowGroup(jobType: number): FormGroup {
    const group = this.fb.group({
      id: [EMPTY_GUID],
      jobType: [jobType],
      orderPrinterId: [EMPTY_GUID],
      orderTray: [null],
      cardPrinter3Id: [EMPTY_GUID],
      cardTray3: [null],
      cardPrinter4Id: [EMPTY_GUID],
      cardTray4: [null],
      cardPrinterAllInOneId: [EMPTY_GUID],
      cardTrayAllInOne: [null],
      orderTrayOptions: [[]],
      cardTray3Options: [[]],
      cardTray4Options: [[]],
      cardTrayAllInOneOptions: [[]],
    });

    this.setupTrayOptionUpdater(group);

    return group;
  }

  private setupTrayOptionUpdater(group: FormGroup) {
    const setTrays = (printerId: string, key: string) => {
      if (printerId) {
        const printer = this.printers.find(p => p.id === printerId);
        group.get(key)?.setValue(printer?.bins ?? [], { emitEvent: false });
      }
    };

    group
      .get('orderPrinterId')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(printerId => setTrays(printerId, 'orderTrayOptions'));

    group
      .get('cardPrinter3Id')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(printerId => setTrays(printerId, 'cardTray3Options'));

    group
      .get('cardPrinter4Id')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(printerId => setTrays(printerId, 'cardTray4Options'));

    group
      .get('cardPrinterAllInOneId')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(printerId => setTrays(printerId, 'cardTrayAllInOneOptions'));
  }

  private loadData(): void {
    forkJoin({
      printers: this.printNodeService.getPrintersForCurrentTenant(),
      printerSetups: this.printerSetupService.getPrinterSetupsForCurrentStore(),
      printingSetting: this.printerSetupService.getPrintingSettings(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ printers, printerSetups, printingSetting }) => {
          this.printers = printers;
          this.populateForm(printingSetting, printerSetups);
        },
        error: () => {
          this.toaster.error('::PrinterSetup:LoadFailed');
        },
      });
  }

  private getTrayOptions(printerId?: string): string[] {
    const printer = this.printers.find(p => p.id === printerId);
    return printer ? (printer.bins ?? []) : [];
  }

  private populateForm(printingSetting: PrintingSettingDto, setups: PrinterSetupDto[]) {
    this.form.patchValue({
      ...printingSetting,
    });

    if (setups.length === 0) return;

    const formArray = this.form.get('jobTypes') as FormArray;
    formArray.clear();

    for (const setup of setups.sort((a, b) => a.printJobType - b.printJobType)) {
      const group = this.fb.group({
        id: [setup?.id],
        jobType: [setup?.printJobType],
        orderPrinterId: [setup?.orderPrinterId],
        orderTray: [setup?.orderTray],
        orderTrayOptions: [this.getTrayOptions(setup?.orderPrinterId)],

        cardPrinter3Id: [setup?.threePanelCardPrinterId],
        cardTray3: [setup?.threePanelCardTray],
        cardTray3Options: [this.getTrayOptions(setup?.threePanelCardPrinterId)],

        cardPrinter4Id: [setup?.fourPanelCardPrinterId],
        cardTray4: [setup?.fourPanelCardTray],
        cardTray4Options: [this.getTrayOptions(setup?.fourPanelCardPrinterId)],

        cardPrinterAllInOneId: [setup?.allInOneCardPrinterId],
        cardTrayAllInOne: [setup?.allInOneCardTray],
        cardTrayAllInOneOptions: [this.getTrayOptions(setup?.allInOneCardPrinterId)],
      });

      this.setupTrayOptionUpdater(group);

      formArray.push(group);
    }
  }
}
