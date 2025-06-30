import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { IndividualPaymentRoutingModule } from './individual-payment-routing.module';
import { IndividualPaymentWrapperComponent } from './individual-payment-wrapper.component';
import { IndividualPaymentListComponent } from './individual-payment-list/individual-payment-list.component';
import { AddUpdateIndividualPaymentComponent } from './add-update-individual-payment/add-update-individual-payment.component';
import { IndividualPaymentCreditCardComponent } from './add-update-individual-payment/individual-payment-credit-card/individual-payment-credit-card.component';

@NgModule({
  declarations: [
    IndividualPaymentWrapperComponent,
    IndividualPaymentListComponent,
    AddUpdateIndividualPaymentComponent,
    IndividualPaymentCreditCardComponent,
  ],
  imports: [CommonModule, IndividualPaymentRoutingModule, SharedModule, MatProgressSpinnerModule],
})
export class IndividualPaymentModule {}
