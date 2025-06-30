import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BatchHouseAccountPaymentComponent } from './batch-house-account-payment.component';
import { RouterModule, Routes } from '@angular/router';
import { AngularMaterialModule } from 'src/app/shared/angular-material/angular-material.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { InvoicesComponent } from './invoices/invoices.component';
import { CheckPaymentProcessingComponent } from './check-payment-processing/check-payment-processing.component';
import { BatchPaymentProcessingDialogComponent } from './batch-payment-processing-dialog/batch-payment-processing-dialog.component';
import { CardPaymentProcessingComponent } from './card-payment-processing/card-payment-processing.component';
import { BatchCardPaymentDialogComponent } from './batch-card-payment-dialog/batch-card-payment-dialog.component';

const routes: Routes = [{ path: '', component: BatchHouseAccountPaymentComponent }];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes), SharedModule, AngularMaterialModule],
  declarations: [
    BatchHouseAccountPaymentComponent,
    InvoicesComponent,
    CheckPaymentProcessingComponent,
    BatchPaymentProcessingDialogComponent,
    CardPaymentProcessingComponent,
    BatchCardPaymentDialogComponent
  ],
})
export class BatchHouseAccountPaymentModule {}
