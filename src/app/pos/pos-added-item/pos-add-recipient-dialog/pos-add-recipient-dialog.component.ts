import { ListService, PagedResultDto } from '@abp/ng.core';
import { ToasterService } from '@abp/ng.theme.shared';
import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { RecipientDeliveryDetailDto, RecipientDto, RecipientService } from '@proxy/recipients';
import { PosAddRecipientDetailsDialogComponent } from '../pos-add-recipient-details-dialog/pos-add-recipient-details-dialog.component';
import { FilterPagedAndSortedResultRequestDto } from '@proxy/shared';
import { SubOrderItem } from '../../models/sub-order-Item.model';
import { take } from 'rxjs';
import { SharedDataService } from '../../shared-data.service';
import { ShippingDetailsDto } from '@proxy/orders';

@Component({
  selector: 'app-pos-add-recipient-dialog',
  templateUrl: './pos-add-recipient-dialog.component.html',
  styleUrls: ['./pos-add-recipient-dialog.component.scss'],
  providers: [ListService],
})
export class PosAddRecipientDialogComponent implements OnInit {
  displayedColumns: string[] = ['firstName', 'address1', 'email', 'number', 'action'];
  recipients: PagedResultDto<RecipientDto> = { items: [], totalCount: 0 };
  customerRecipients: PagedResultDto<RecipientDto> = { items: [], totalCount: 0 };
  filter: string = '';
  customerId: string = '';
  recipientDeliveryDetails: RecipientDeliveryDetailDto;
  @Output() recipientAddedChange = new EventEmitter<boolean>();

  filterMyRecipient: string = '';

  constructor(
    public readonly list: ListService,
    public iconPageDialogRef: MatDialogRef<PosAddRecipientDialogComponent>,
    private readonly dialog: MatDialog,
    private readonly recipientService: RecipientService,
    private readonly toasterService: ToasterService,
    private readonly sharedDataService: SharedDataService,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      productName: string;
      productId: string;
      quantity: number;
      subOrder: SubOrderItem;
      isMasterRecipient: boolean;
      productsData: { subOrder: SubOrderItem }[];
      productCodes: string[];
    },
  ) {}

  ngOnInit(): void {
    const recipientStreamCreator = query => this.recipientService.getList(query);
    this.list.hookToQuery(recipientStreamCreator).subscribe(response => {
      this.recipients = response;
    });

    this.customerId = this.sharedDataService.getCustomer()?.id;

    if (this.customerId) {
      this.recipientService
        .getRecipientByCustomerIdByIdAndInput(this.customerId, {
          filter: this.filterMyRecipient,
        } as FilterPagedAndSortedResultRequestDto)
        .subscribe(
          (response: PagedResultDto<RecipientDto>) => {
            this.customerRecipients = response;
          },
          error => {
            this.toasterService.error('::FailedToLoadCustomerRecipients');
          },
        );
    }
  }

  search(filter: any) {
    this.filter = filter;
    this.recipientService
      .getList({ filter: this.filter } as FilterPagedAndSortedResultRequestDto)
      .subscribe(response => {
        this.recipients = response;
      });
  }

  searchMyRecipient(filter: any) {
    this.filter = filter;
    this.recipientService
      .getRecipientByCustomerIdByIdAndInput(this.customerId, {
        filter: this.filter,
      } as FilterPagedAndSortedResultRequestDto)
      .subscribe(response => {
        this.customerRecipients = response;
      });
  }

  changeSort(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
    this.loadRecipients();
  }

  changeSortMyRecipient(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
    if (this.customerId) {
      this.loadRecipients(true);
    }
  }

  changePage(event: PageEvent): void {
    this.list.page = event.pageIndex;
    this.list.maxResultCount = event.pageSize;
    this.list.get();
  }

  onAddNewRecipient(): void {
    const dialogRef = this.dialog.open(PosAddRecipientDetailsDialogComponent, {
      width: '1000px',
      data: {
        recipient: null,
        productId: this.data.productId,
        subOrderItem: this.data?.subOrder,
        quantity: this.data.quantity,
        subOrderItems: this.data?.productsData,
        productCodes: this.data?.productCodes?.length > 1 ? this.data?.productCodes : null,
        isMasterRecipient: !!this.data?.isMasterRecipient,
        deliveryDetails: undefined,
        personalizations: [],
      },
    });

    dialogRef.afterClosed().subscribe({
      next: result => {
        if (result) {
          this.iconPageDialogRef.close(result);
          this.toasterService.success('::RecipientAdded');
        }
      },
      error: _ => {
        this.toasterService.error('::RecipientAddFailed');
      },
    });
  }

  onSelectRecipient(recipient): void {
    if (!recipient) return;
    this.recipientService
      .getShippingDetailsByRecipientId(recipient.id)
      .subscribe((shippingDetailsDto: ShippingDetailsDto) => {
        let deliveryDetailsDto = {
          ...shippingDetailsDto.deliveryDetailsDto,
          deliveryFromDate: null,
          deliveryToDate: null,
          deliveryFeeType: null,
          isTimeRequired: false,
          deliveryTimeHour: null,
          deliveryTimeMinute: null,
          deliveryTimeType: null,
          deliveryFee: 0,
        };
        const dialogRef = this.dialog.open(PosAddRecipientDetailsDialogComponent, {
          width: '1000px',
          data: {
            subOrderItem: this.data?.subOrder,
            subOrderItems: this.data?.productsData,
            quantity: this.data?.quantity,
            recipient: shippingDetailsDto.recipientDto,
            deliveryDetails: deliveryDetailsDto,
            personalizations: shippingDetailsDto.recipientPersonalizationDtos,
            productCodes: this.data?.productCodes?.length > 1 ? this.data?.productCodes : null,
          },
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.iconPageDialogRef.close(result);
            this.toasterService.success('::RecipientAdded');
          }
        });
      });
  }

  onClose(): void {
    this.iconPageDialogRef.close();
  }

  private loadRecipients(isCustomerRecipients: boolean = false): void {
    const filter = isCustomerRecipients ? this.filterMyRecipient : this.filter;
    const queryStream = query =>
      isCustomerRecipients
        ? this.recipientService.getRecipientByCustomerIdByIdAndInput(this.customerId, {
            ...query,
            filter,
          } as FilterPagedAndSortedResultRequestDto)
        : this.recipientService.getList({
            ...query,
            filter,
          });

    this.list
      .hookToQuery(queryStream)
      .pipe(take(1))
      .subscribe(response => {
        if (isCustomerRecipients) {
          this.customerRecipients = response;
        } else {
          this.recipients = response;
        }
      });
  }
}
