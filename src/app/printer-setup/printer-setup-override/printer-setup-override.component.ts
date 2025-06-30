import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import {
  PrinterLookupDto,
  PrinterOverrideType,
  PrinterSetupDto,
  PrinterSetupService,
  PrintJobType,
} from '@proxy/print-node';
import { ListService, PagedResultDto } from '@abp/ng.core';
import { Subject, take, takeUntil } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { PrinterSetupOverrideDialogComponent } from '../printer-setup-override-dialog/printer-setup-override-dialog.component';
import {
  DIALOG_ENTER_ANIMATION_DURATION,
  DIALOG_EXIT_ANIMATION_DURATION,
} from '../../shared/dialog.constants';
import { Confirmation, ConfirmationService, ToasterService } from '@abp/ng.theme.shared';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';

@Component({
  selector: 'app-printer-setup-override',
  templateUrl: './printer-setup-override.component.html',
  styleUrl: './printer-setup-override.component.scss',
})
export class PrinterSetupOverrideComponent implements OnInit, OnDestroy {
  columns: string[] = [
    'printJobType',
    'overrideType',
    'overrideValue',
    'orderPrinter',
    'threePanelCardPrinter',
    'fourPanelCardPrinter',
    'allInOneCardPrinter',
    'actions',
  ];
  printerLookup: Record<string, PrinterLookupDto> = {};
  readonly PrintJobType = PrintJobType;
  protected readonly console = console;

  overridePrinterSetups = { totalCount: 0, items: [] } as PagedResultDto<PrinterSetupDto>;
  overrideType = PrinterOverrideType;
  private readonly printerIdMap = {
    order: 'orderPrinterId',
    panel3: 'threePanelCardPrinterId',
    panel4: 'fourPanelCardPrinterId',
    allInOne: 'allInOneCardPrinterId',
  };
  private readonly trayMap = {
    order: 'orderTray',
    panel3: 'threePanelCardTray',
    panel4: 'fourPanelCardTray',
    allInOne: 'allInOneCardTray',
  };
  private destroy$: Subject<void> = new Subject<void>();

  constructor(
    public readonly list: ListService,
    private readonly printerSetupService: PrinterSetupService,
    private readonly dialog: MatDialog,
    private readonly toaster: ToasterService,
    private readonly cdr: ChangeDetectorRef,
    private readonly confirmation: ConfirmationService,
  ) {}

  private _printers: PrinterLookupDto[];

  get printers(): PrinterLookupDto[] {
    return this._printers;
  }

  ngOnInit(): void {
    this.loadPrinterSetups();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @Input()
  set printers(value: PrinterLookupDto[]) {
    this._printers = value;
    this.buildPrinterLookup();
  }

  addOverridePrinterSetup() {
    const data = {
      isEditMode: true,
      printers: this.printers,
    };
    this.openPrinterSetupDialog(data);
  }

  editOverridePrinterSetup(id: string) {
    this.printerSetupService
      .getOverridePrinterSetup(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((printerSetup: PrinterSetupDto) => {
        const data = {
          isEditMode: true,
          printers: this.printers,
          printerSetup,
        };
        this.openPrinterSetupDialog(data);
      });
  }

  delete(id: string) {
    this.confirmation.warn('::AreYouSureToDelete', '::AreYouSure').subscribe(status => {
      if (status === Confirmation.Status.confirm) {
        this.printerSetupService
          .deletePrinterSetup(id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.loadPrinterSetups(() => {
                this.toaster.success('::PrinterSetupOverride:DeletedSuccessfully');
              });
            },
            error: () => {
              this.toaster.error('::SomethingWentWrong');
            },
          });
      }
    });
  }

  onSort(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
    this.loadPrinterSetups();
  }

  changePage(event: PageEvent) {
    this.list.page = event.pageIndex;
    this.loadPrinterSetups();
  }

  getPrinterInfo(
    element: PrinterSetupDto,
    type: keyof typeof this.printerIdMap,
  ): {
    name: string;
    tray: string | null;
  } | null {
    const printerId = element[this.printerIdMap[type]];
    const printer = this.printerLookup[printerId];

    if (!printerId || !printer) {
      return null;
    }

    return { name: printer.name, tray: element[this.trayMap[type]] };
  }

  private loadPrinterSetups(onSuccess?: () => void) {
    this.list
      .hookToQuery(query => this.printerSetupService.getOverridePrinterSetupsForCurrentStore(query))
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe((result: PagedResultDto<PrinterSetupDto>) => {
        this.overridePrinterSetups = result;
        this.cdr.detectChanges();

        if (onSuccess) {
          onSuccess();
        }
      });
  }

  private buildPrinterLookup() {
    if (!this.printers) return;

    this.printerLookup = this.printers.reduce(
      (acc, printer) => {
        acc[printer.id] = printer;
        return acc;
      },
      {} as Record<string, PrinterLookupDto>,
    );
  }

  private openPrinterSetupDialog(data: any) {
    const dialogRef = this.dialog.open(PrinterSetupOverrideDialogComponent, {
      width: '60%',
      height: '65%',
      data,
      enterAnimationDuration: DIALOG_ENTER_ANIMATION_DURATION,
      exitAnimationDuration: DIALOG_EXIT_ANIMATION_DURATION,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: PrinterSetupDto | undefined) => {
        if (!result) return;
        this.printerSetupService.savePrinterSetupForCurrentStore([result]).subscribe({
          next: () => {
            this.loadPrinterSetups(() => {
              this.toaster.success('::PrinterSetupOverride:SavedSuccessfully');
            });
          },
          error: () => {
            this.toaster.error('::SomethingWentWrong');
          },
        });
      });
  }
}
