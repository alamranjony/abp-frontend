import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { CustomerCommentRoutingModule } from './customer-comment-routing.module';
import { CustomerCommentComponent } from './customer-comment.component';
import { BackButtonComponent } from '../shared/components/back-button/back-button.component';

@NgModule({
  declarations: [CustomerCommentComponent],
  imports: [CustomerCommentRoutingModule, SharedModule, BackButtonComponent],
})
export class CustomerCommentModule {}
