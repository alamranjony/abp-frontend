import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GiftCardComponent } from './gift-card.component';
import { authGuard, permissionGuard } from '@abp/ng.core';
import { EditGiftCardComponent } from './edit-gift-card/edit-gift-card.component';

const routes: Routes = [
  {
    path: '',
    component: GiftCardComponent,
    canActivate: [authGuard, permissionGuard],
    children: [{ path: '', component: GiftCardComponent }],
  },
  { path: 'edit/:id', component: EditGiftCardComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GiftCardRoutingModule {}
