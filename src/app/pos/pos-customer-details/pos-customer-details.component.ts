import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CustomerDto } from '@proxy/customers';
import { AddCustomerPopupComponent } from '../add-customer-popup/add-customer-popup.component';
import { AbpLocalStorageService } from '@abp/ng.core';

@Component({
  selector: 'app-pos-customer-details',
  templateUrl: './pos-customer-details.component.html',
  styleUrl: './pos-customer-details.component.scss',
})
export class PosCustomerDetailsComponent {
  customer: CustomerDto;
  email: string;
  phoneNumber: string;

  constructor(
    public dialogRef: MatDialogRef<PosCustomerDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CustomerDto,
    public dialog: MatDialog,
    private localStorageService: AbpLocalStorageService,
  ) {
    this.customer = data;
    this.email = this.customer.emailDirectories.find(() => true)?.email;
    this.phoneNumber = this.customer.phoneDirectories.find(() => true)?.phoneNumber;
  }

  addCustomer(): void {
    this.localStorageService.setItem('customer', JSON.stringify(this.customer));

    this.dialogRef.close('added');
  }

  editCustomer() {
    const dialogRef = this.dialog.open(AddCustomerPopupComponent, {
      width: '1200px',
      data: { customerId: this.customer?.id },
    });

    dialogRef.afterClosed().subscribe((response: string) => {
      if (response === 'added') this.dialogRef.close('added');
    });
  }
}
