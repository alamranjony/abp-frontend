import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { RouterModule } from '@angular/router';
import { GiftCardRoutingModule } from './gift-card-routing.module';
import { GiftCardComponent } from './gift-card.component';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { EditGiftCardComponent } from './edit-gift-card/edit-gift-card.component';
import { AngularMaterialModule } from '../shared/angular-material/angular-material.module';
import { GiftCardDialogComponent } from './gift-card-dialog/gift-card-dialog.component';
import { RenewGiftCardDialogComponent } from './renew-gift-card-dialog/renew-gift-card-dialog.component';
import { authGuard, permissionGuard } from '@abp/ng.core';

@NgModule({
  declarations: [
    GiftCardComponent,
    EditGiftCardComponent,
    GiftCardDialogComponent,
    RenewGiftCardDialogComponent,
  ],
  imports: [
    SharedModule,
    GiftCardRoutingModule,
    NgbDatepickerModule,
    AngularMaterialModule,
    RouterModule.forChild([
      { path: '', component: GiftCardComponent },
      {
        path: 'edit/:id',
        component: EditGiftCardComponent,
        canActivate: [authGuard, permissionGuard],
        data: { requiredPolicy: 'ClientPortal.GiftCards.CreateAndEdit' },
      },
    ]),
  ],
})
export class GiftCardModule {}
