import { ListService, PagedResultDto } from '@abp/ng.core';
import { Confirmation, ConfirmationService, ToasterService } from '@abp/ng.theme.shared';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  CreateUpdateDeliveryShortCodeDto,
  DeliveryShortCodeDto,
  DeliveryShortCodeService,
} from '@proxy/deliveries';
import { DeliveryShortCodeDialogComponent } from './delivery-short-code-dialog/delivery-short-code-dialog.component';
import { Sort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';
import { take } from 'rxjs';
import { EXPORT_CONFIG } from '../export/export-config';
import {
  DIALOG_ENTER_ANIMATION_DURATION,
  DIALOG_EXIT_ANIMATION_DURATION,
} from '../shared/dialog.constants';
import { ImportDeliveryShortCodeComponent } from './import-delivery-short-code/import-delivery-short-code.component';

@Component({
  selector: 'app-delivery-short-code',
  templateUrl: './delivery-short-code.component.html',
  styleUrl: './delivery-short-code.component.scss',
  providers: [ListService],
})
export class DeliveryShortCodeComponent implements OnInit {
  deliveryShortCodes = { items: [], totalCount: 0 } as PagedResultDto<DeliveryShortCodeDto>;
  columns: string[] = [
    'code',
    'name',
    'address1',
    'city',
    'stateProvince',
    'zipCode',
    'specialDeliveryCharge',
    'specialInstruction',
    'actions',
  ];
  filter: string = '';
  exportUrl = EXPORT_CONFIG.deliveryShortCodesUrl;
  exportFileName: string = `Short_code_${this.getFormattedDateTime()}`;
  exportFieldList: string[] = [
    'code',
    'name',
    'address1',
    'address2',
    'stateProvince',
    'country',
    'city',
    'zipCode',
    'phoneNumber',
    'specialInstruction',
    'storeCode',
    'deliveryTypeName',
    'deliveryZone',
    'useDefaultDeliveryCharge',
    'specialDeliveryCharge',
  ];
  exportDisplayColumnList: string[] = [
    'Short_Code',
    'Location_Name',
    'Address1',
    'Address2',
    'State/Province',
    'Country',
    'City',
    'Zip_Code',
    'Phone_Number',
    'Special_Instruction',
    'Store_Code',
    'Delivery_Type',
    'Delivery_Zone',
    'Use_Default_Delivery_Charge',
    'Special_Delivery_Charge',
  ];
  private readonly downloadFileLocation = 'assets/templates/DeliveryShortCodeImportTemplate.xlsx';
  private readonly downloadImportFileName = 'Short_Code_Import_Template.xlsx';

  constructor(
    public readonly list: ListService,
    private readonly deliveryShortCodeService: DeliveryShortCodeService,
    private readonly confirmation: ConfirmationService,
    private dialog: MatDialog,
    private toasterService: ToasterService,
  ) {}

  ngOnInit(): void {
    this.loadDeliveryShortCodes();
  }

  addDeliveryShortCode() {
    this.openDialog({ isEditMode: false }).subscribe((result: CreateUpdateDeliveryShortCodeDto) => {
      if (result) {
        this.deliveryShortCodeService.create(result).subscribe({
          next: () => {
            this.loadDeliveryShortCodes();
            this.toasterService.success('::DeliveryShortCode:SuccessfullyAdded');
          },
          error: () => {
            this.toasterService.error('::DeliveryShortCode:ErrorSaving');
          },
        });
      }
    });
  }

  editDeliveryShortCode(id: string) {
    this.deliveryShortCodeService.get(id).subscribe(response => {
      this.openDialog({ ...response, isEditMode: true }).subscribe(
        (result: CreateUpdateDeliveryShortCodeDto) => {
          if (result) {
            this.deliveryShortCodeService.update(id, result).subscribe({
              next: () => {
                this.loadDeliveryShortCodes();
                this.toasterService.success('::DeliveryShortCode:SuccessfullyUpdated');
              },
              error: () => {
                this.toasterService.error('::DeliveryShortCode:ErrorSaving');
              },
            });
          }
        },
      );
    });
  }

  delete(id: string) {
    this.confirmation.warn('::AreYouSureToDelete', '::AreYouSure').subscribe(status => {
      if (status === Confirmation.Status.confirm) {
        this.deliveryShortCodeService.delete(id).subscribe({
          next: () => {
            this.loadDeliveryShortCodes();
            this.toasterService.success('::DeliveryShortCode:SuccessfullyDeleted');
          },
          error: () => {
            this.toasterService.error('::DeliveryShortCode:ErrorDeleting');
          },
        });
      }
    });
  }

  search(filter: string) {
    this.filter = filter;
    this.list.page = 0;
    this.loadDeliveryShortCodes();
  }

  changeSort(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
    this.loadDeliveryShortCodes();
  }

  changePage(event: PageEvent) {
    this.list.page = event.pageIndex;
    this.loadDeliveryShortCodes();
  }

  private loadDeliveryShortCodes() {
    this.list
      .hookToQuery(query =>
        this.deliveryShortCodeService.getList({
          ...query,
          filter: this.filter,
        }),
      )
      .pipe(take(1))
      .subscribe(response => {
        this.deliveryShortCodes = response;
      });
  }

  private openDialog(data: any): any {
    return this.dialog
      .open(DeliveryShortCodeDialogComponent, {
        width: '60%',
        data,
        enterAnimationDuration: DIALOG_ENTER_ANIMATION_DURATION,
        exitAnimationDuration: DIALOG_EXIT_ANIMATION_DURATION,
      })
      .afterClosed();
  }

  handleImportClick() {
    const dialogRef = this.dialog.open(ImportDeliveryShortCodeComponent, {
      width: '50%',
      enterAnimationDuration: DIALOG_ENTER_ANIMATION_DURATION,
    });

    dialogRef.afterClosed().subscribe((result: DeliveryShortCodeDto[] | null) => {
      if (result && result.length > 0) {
        const deliveryShortCodes = result as DeliveryShortCodeDto[];
        this.deliveryShortCodeService.import(deliveryShortCodes).subscribe({
          next: () => {
            this.loadDeliveryShortCodes();
            this.toasterService.success('::DeliveryShortCodeImport:SuccessfullyImported');
          },
        });
      }
    });
  }

  private getFormattedDateTime() {
    const now = new Date();

    const [month, day, year] = [now.getMonth() + 1, now.getDate(), now.getFullYear()];
    const [hours24, minutes, seconds] = [now.getHours(), now.getMinutes(), now.getSeconds()];

    const hours = hours24 % 12 || 12;
    const ampm = hours24 >= 12 ? 'PM' : 'AM';

    const pad = num => String(num).padStart(2, '0');

    return `${month}_${day}_${year}_${pad(hours)}_${pad(minutes)}_${pad(seconds)}_${ampm}`;
  }

  downloadTemplate(): void {
    const link = document.createElement('a');
    link.href = this.downloadFileLocation;
    link.download = this.downloadImportFileName;
    link.click();
  }
}
