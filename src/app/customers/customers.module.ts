import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomersRoutingModule } from './customers-routing.module';
import { SharedModule } from '../shared/shared.module';
import { CustomerListComponent } from './customer-list/customer-list.component';
import { EmailDirectoryModule } from '../email-directory/email-directory.module';
import { PhoneDirectoryModule } from '../phone-directory/phone-directory.module';
import { CustomerFormComponent } from './customer-form/customer-form.component';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { CustomerBalanceDetailsComponent } from './customer-balance-details/customer-balance-details.component';
import { CustomerPayableDetailsComponent } from './customer-balance-details/customer-payable-details/customer-payable-details.component';
import { CustomerInvoiceListComponent } from './customer-balance-details/customer-invoice-list/customer-invoice-list.component';
import { BackButtonComponent } from '../shared/components/back-button/back-button.component';
import { ImportCustomerDataComponent } from './import-customer-data/import-customer-data.component';

@NgModule({
  declarations: [
    CustomerListComponent,
    CustomerFormComponent,
    CustomerBalanceDetailsComponent,
    ImportCustomerDataComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    CustomersRoutingModule,
    EmailDirectoryModule,
    PhoneDirectoryModule,
    MatAutocomplete,
    MatAutocompleteTrigger,
    CustomerPayableDetailsComponent,
    CustomerInvoiceListComponent,
    BackButtonComponent,
  ],
})
export class CustomersModule {}
