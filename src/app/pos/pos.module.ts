import { NgModule } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { AngularMaterialModule } from '../shared/angular-material/angular-material.module';
import { POSRoutingModule } from './pos-routing.module';
import { POSComponent } from './pos.component';
import { PosTopItemComponent } from './pos-top-item/pos-top-item.component';
import { PosTopBarComponent } from './pos-top-bar/pos-top-bar.component';
import { PosAddedItemComponent } from './pos-added-item/pos-added-item.component';
import { PosCustomerComponent } from './pos-customer/pos-customer.component';
import { PosSaleOrderTypeComponent } from './pos-sale-order-type/pos-sale-order-type.component';
import { PosProductDetailsComponent } from './pos-product-details/pos-product-details.component';
import { PosSearchProductPopupComponent } from './pos-search-product-popup/pos-search-product-popup.component';
import { PosAddedItemIconComponent } from './pos-added-item/pos-added-item-icon/pos-added-item-icon.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatToolbarModule } from '@angular/material/toolbar';
import { PosCustomerListComponent } from './pos-customer-list/pos-customer-list.component';
import { PosCustomerDetailsComponent } from './pos-customer-details/pos-customer-details.component';
import { PosDiscountComponent } from './pos-discount/pos-discount.component';
import { PosDueComponent } from './pos-due/pos-due.component';
import { PosPaymentComponent } from './pos-payment/pos-payment.component';
import { PosBillSummaryComponent } from './pos-bill-summary/pos-bill-summary.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { PosPaymentDetailsComponent } from './pos-payment-details/pos-payment-details.component';
import { PosCardComponent } from './pos-payment-details/pos-card/pos-card.component';
import { PosCheckComponent } from './pos-payment-details/pos-check/pos-check.component';
import { PosGiftCardPaymentComponent } from './pos-payment-details/pos-gift-card-payment/pos-gift-card-payment.component';
import { PosCashComponent } from './pos-payment-details/pos-cash/pos-cash.component';
import { PosGiftcardPopupComponent } from './pos-giftcard-popup/pos-giftcard-popup.component';
import { AddCustomerPopupComponent } from './add-customer-popup/add-customer-popup.component';
import { EmailDirectoryModule } from '../email-directory/email-directory.module';
import { PosGiftCardPaymentDetailsComponent } from './pos-payment-details/pos-gift-card-payment-details/pos-gift-card-payment-details.component';
import { PosTipComponent } from './pos-tip/pos-tip.component';
import { PosTipPopupComponent } from './pos-tip-popup/pos-tip-popup.component';
import { PosAddRecipientDialogComponent } from './pos-added-item/pos-add-recipient-dialog/pos-add-recipient-dialog.component';
import { PosAddRecipientDetailsDialogComponent } from './pos-added-item/pos-add-recipient-details-dialog/pos-add-recipient-details-dialog.component';
import { MatStepperModule } from '@angular/material/stepper';
import { PosWillCallDialogComponent } from './pos-added-item/pos-will-call-dialog/pos-will-call-dialog.component';
import { PosCarryOutDialogComponent } from './pos-added-item/pos-carry-out-dialog/pos-carry-out-dialog.component';
import { HttpClientModule } from '@angular/common/http';
import { AddressSuggestionDialogComponent } from './pos-added-item/pos-add-recipient-details-dialog/address-suggestion-dialog/address-suggestion-dialog.component';
import { CardAmountComponent } from './pos-payment-details/pos-card/card-amount/card-amount.component';
import { PartialPaymentConfirmationComponent } from './pos-payment-details/partial-payment-confirmation/partial-payment-confirmation.component';
import { PosHouseAccountComponent } from './pos-payment-details/pos-house-account/pos-house-account.component';
import { PosRefundComponent } from './pos-refund/pos-refund.component';
import { PosCancelReasonDialogComponent } from './pos-cancel-reason-dialog/pos-cancel-reason-dialog.component';
import { PosCRRefundComponent } from './pos-refund/pos-cr-refund/pos-cr-refund.component';

@NgModule({
  declarations: [
    POSComponent,
    PosProductDetailsComponent,
    PosTopItemComponent,
    PosCustomerComponent,
    PosSaleOrderTypeComponent,
    PosSearchProductPopupComponent,
    PosTopBarComponent,
    PosAddedItemComponent,
    PosAddedItemIconComponent,
    PosCustomerListComponent,
    PosCustomerDetailsComponent,
    PosDiscountComponent,
    PosDueComponent,
    PosPaymentComponent,
    PosBillSummaryComponent,
    PosPaymentDetailsComponent,
    PosCardComponent,
    PosCheckComponent,
    PosGiftCardPaymentComponent,
    PosCashComponent,
    PosGiftcardPopupComponent,
    AddCustomerPopupComponent,
    PosGiftCardPaymentDetailsComponent,
    PosTipComponent,
    PosTipPopupComponent,
    PosAddRecipientDialogComponent,
    PosAddRecipientDetailsDialogComponent,
    PosWillCallDialogComponent,
    PosCarryOutDialogComponent,
    AddressSuggestionDialogComponent,
    CardAmountComponent,
    PartialPaymentConfirmationComponent,
    PosRefundComponent,
    PosCancelReasonDialogComponent,
    PosCRRefundComponent,
  ],
  imports: [
    CommonModule,
    POSRoutingModule,
    SharedModule,
    AngularMaterialModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    AsyncPipe,
    MatToolbarModule,
    MatExpansionModule,
    EmailDirectoryModule,
    MatStepperModule,
    HttpClientModule,
    PosHouseAccountComponent,
  ],
  providers: [],
})
export class POSModule {}
