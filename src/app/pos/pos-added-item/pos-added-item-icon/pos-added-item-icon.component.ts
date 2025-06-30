import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PosAddRecipientDialogComponent } from '../pos-add-recipient-dialog/pos-add-recipient-dialog.component';
import { PosWillCallDialogComponent } from '../pos-will-call-dialog/pos-will-call-dialog.component';
import { PosCarryOutDialogComponent } from '../pos-carry-out-dialog/pos-carry-out-dialog.component';
import { OccasionCode, RecipientPersonalizationDto } from '@proxy/recipients';
import { ToasterService } from '@abp/ng.theme.shared';
import { SubOrderItem } from '../../models/sub-order-Item.model';
import { SharedDataService } from '../../shared-data.service';
import { DeliveryCategory, OrderType } from '@proxy/orders';
import { OrderSummary } from '../../models/order-summary.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-pos-added-item-icon',
  templateUrl: './pos-added-item-icon.component.html',
  styleUrl: './pos-added-item-icon.component.scss',
})
export class PosAddedItemIconComponent implements OnInit, OnDestroy {
  topIcon = [
    { id: 1, icon: 'storefront', title: 'Carry Out' },
    { id: 2, icon: 'call', title: 'Will Call' },
    { id: 3, icon: 'person_add', title: 'Add Recipient' },
  ];
  @Input() subOrderItem: SubOrderItem | undefined;
  recipientAdded: boolean = false;
  recipientName: string | undefined;
  recipient: any;

  orderSummary: OrderSummary;
  destroy$: Subject<void> = new Subject();

  constructor(
    private readonly dialog: MatDialog,
    private readonly toasterService: ToasterService,
    private readonly sharedDataService: SharedDataService,
  ) {}

  ngOnInit(): void {
    this.sharedDataService.orderSummary
      .pipe(takeUntil(this.destroy$))
      .subscribe((x: OrderSummary) => {
        this.orderSummary = x;
      });
  }

  handleIconClick(id: number): void {
    switch (id) {
      case 3:
        this.openAddRecipientModal();
        break;
      case 2:
        this.openWillCallModal();
        break;
      case 1:
        this.openCarryOutModal();
        break;
    }
  }

  openAddRecipientModal(): void {
    const dialogRef = this.dialog.open(PosAddRecipientDialogComponent, {
      width: '1000px',
      data: {
        productName: this.subOrderItem.productItem.name,
        productId: this.subOrderItem.productId,
        quantity: this.subOrderItem.qty,
        subOrder: this.subOrderItem,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.subOrderItem.deliveryCategory = DeliveryCategory.Recipient;
        this.subOrderItem.recipient = result?.recipientDto;
        this.subOrderItem.deliveryFrom = result?.deliveryDetailsDto.deliveryFromDate;
        this.subOrderItem.deliveryTo = result?.deliveryDetailsDto.deliveryToDate;
        this.subOrderItem.recipientId = result?.recipientDto?.id;
        this.subOrderItem.zoneSaleTax = result?.zoneSaleTax;
        this.subOrderItem.deliveryFee = result?.deliveryFee;
        this.subOrderItem.deliveryDetailId = result?.deliveryDetailsDto?.id;

        if (result.occasion) this.subOrderItem.occasionCode = result.occasion;

        this.sharedDataService.broadcastOrderSummary();
      }
    });
  }

  openWillCallModal(): void {
    const dialogRef = this.dialog.open(PosWillCallDialogComponent, {
      width: '1000px',
      data: {
        subOrderItem: this.subOrderItem,
        deliveryDetails: undefined,
        personalizations: [],
      },
    });

    dialogRef
      .afterClosed()
      .subscribe(
        (result: {
          recipientPersonalizationDtos: RecipientPersonalizationDto[];
          occasion: OccasionCode;
        }) => {
          if (result) {
            this.subOrderItem.deliveryCategory = DeliveryCategory.WillCall;
            this.subOrderItem.isWillPickup = true;
            this.subOrderItem.personalizations = result.recipientPersonalizationDtos;
            this.subOrderItem.recipientName = result.recipientPersonalizationDtos[0]?.recipientName;

            if (result.occasion) this.subOrderItem.occasionCode = result.occasion;

            this.sharedDataService.broadcastOrderSummary();
            this.toasterService.success('::WillCallDataAdded');
          }
        },
      );
  }

  openCarryOutModal(): void {
    const dialogRef = this.dialog.open(PosCarryOutDialogComponent, {
      width: '1000px',
      data: {
        subOrderItem: this.subOrderItem,
        personalizations: [],
      },
    });

    dialogRef
      .afterClosed()
      .subscribe(
        (result: {
          recipientPersonalizationDtos: RecipientPersonalizationDto[];
          occasion: OccasionCode;
        }) => {
          if (result) {
            this.subOrderItem.deliveryCategory = DeliveryCategory.CarryOut;
            this.subOrderItem.isCarryOut = true;
            this.subOrderItem.personalizations = result.recipientPersonalizationDtos;
            this.subOrderItem.recipientName = result.recipientPersonalizationDtos[0]?.recipientName;

            if (result.occasion) this.subOrderItem.occasionCode = result.occasion;

            this.sharedDataService.broadcastOrderSummary();
            this.toasterService.success('::CarryOutDataAdded');
          }
        },
      );
  }

  disableIcon(iconId: number): boolean {
    switch (this.orderSummary?.orderType) {
      case OrderType.PU:
      case OrderType.PHO:
        return iconId === 3;
      case OrderType.SO:
      case OrderType.PO:
      case OrderType.DO:
        return iconId !== 1;
      default:
        return true;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
