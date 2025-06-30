import { Injectable, OnDestroy } from '@angular/core';
import {
  catchError,
  filter,
  forkJoin,
  map,
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap,
  timer,
} from 'rxjs';
import { SharedDataService } from './shared-data.service';
import { OrderStatus, OrderType, SubOrderService } from '@proxy/orders';
import { OrderSummary } from './models/order-summary.model';
import { PrintDesignOrderService } from '../services/print-design-order.service';
import { PosPrintService } from '@proxy/pos-printing';
import { CreatePrintJobDto, PrintJobType, PrintNodeService } from '@proxy/print-node';
import { ToasterService } from '@abp/ng.theme.shared';
import { PosPrintOrderDialogComponent } from './pos-print-order-dialog/pos-print-order-dialog.component';
import { isDesignModuleNotApplicable } from '../shared/common-utils';

@Injectable({ providedIn: 'root' })
export class OrderDataService implements OnDestroy {
  cutOffTime: number = 0;
  destroy$ = new Subject<void>();

  constructor(
    private readonly sharedDataService: SharedDataService,
    private readonly printDesignOrderService: PrintDesignOrderService,
    private readonly posPrintService: PosPrintService,
    private readonly printNodeService: PrintNodeService,
    private readonly toasterService: ToasterService,
    private readonly subOrderService: SubOrderService,
    private readonly posPrintOrderDialog: PosPrintOrderDialogComponent,
  ) {
    this.cutOffTime = this.sharedDataService.corporateSettings.cutOffTime;
  }

  printOrder(order: OrderSummary, orderStatus: OrderStatus) {
    if (orderStatus !== OrderStatus.InProgress || isDesignModuleNotApplicable(order.orderType))
      return;

    const remainingTimeInMS = this.getRemainingTimeInMS();

    const subOrderIds = order.subOrderItems.map(item => item.id);
    if (remainingTimeInMS > 0) {
      timer(remainingTimeInMS).subscribe(() => {
        this.printInvoice(subOrderIds);
      });
    } else {
      this.printInvoice(subOrderIds);
    }
  }

  private getRemainingTimeInMS() {
    const currentTimeInMS = Date.now();
    const cutOffTimeInMS = this.cutOffTime * 60 * 1000;
    const cutoffTimestamp = currentTimeInMS + cutOffTimeInMS;
    const remainingTimeInMS = cutoffTimestamp - currentTimeInMS;
    return remainingTimeInMS;
  }

  private printInvoice(subOrderIds: string[]) {
    this.posPrintService
      .getSubOrdersWithOptionalNotepad(subOrderIds, true)
      .pipe(
        takeUntil(this.destroy$),
        filter(subOrders => subOrders.length > 0),
        switchMap(subOrders => {
          const printJobs$ = ([] as Observable<string | null>[]).concat(
            ...subOrders.map(subOrder => {
              const jobs: Observable<string | null>[] = [];

              const doc = this.printDesignOrderService.generateOrderWithBarcode(subOrder);
              const orderPrintJob: CreatePrintJobDto = {
                source: 'order-copy-print',
                printJobType: PrintJobType.HotshotPriorityOrder,
                base64Content: doc.output('datauristring').split(',')[1],
              } as CreatePrintJobDto;
              jobs.push(
                this.printNodeService.createPrintJob(orderPrintJob).pipe(
                  tap(() => this.toasterService.success('::InvoicePrint:PrintSuccess')),
                  map(() => subOrder.subOrderId),
                  catchError(() => {
                    this.toasterService.error('::InvoicePrint:PrintError');
                    return of(null);
                  }),
                ),
              );

              if (!subOrder.isPrintCardTemplateWithOrderCopy) {
                const cardPdf = this.posPrintOrderDialog.generateCardMessageTemplate(subOrder);
                const cardPrintJob: CreatePrintJobDto = {
                  source: 'card-message-print',
                  printJobType: PrintJobType.LocalOrder,
                  base64Content: cardPdf.output('datauristring').split(',')[1],
                } as CreatePrintJobDto;
                jobs.push(
                  this.printNodeService.createPrintJob(cardPrintJob).pipe(
                    tap(() => this.toasterService.success('::InvoicePrint:PrintSuccess')),
                    map(() => subOrder.subOrderId),
                    catchError(() => {
                      this.toasterService.error('::InvoicePrint:PrintError');
                      return of(null);
                    }),
                  ),
                );
              }

              return jobs;
            }),
          );

          return forkJoin(printJobs$);
        }),
        switchMap((printedSubOrderIds: (string | null)[]) => {
          const filteredIds = printedSubOrderIds.filter(id => !!id) as string[];
          if (filteredIds.length === 0) return of(null);

          return this.subOrderService.updateSubOrdersDesignStatus(filteredIds).pipe(
            catchError(() => {
              this.toasterService.error('::OrderCopy:DesignStatusUpdateError');
              return of(null);
            }),
          );
        }),
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
