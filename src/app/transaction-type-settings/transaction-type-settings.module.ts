import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionTypeSettingsComponent } from './transaction-type-settings.component';
import { RouterModule, Routes } from '@angular/router';
import { AngularMaterialModule } from '../shared/angular-material/angular-material.module';
import { SharedModule } from '../shared/shared.module';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CreateUpdateTransactionTypeDialogComponent } from './create-update-transaction-type-dialog/create-update-transaction-type-dialog.component';

const routes: Routes = [{ path: '', component: TransactionTypeSettingsComponent }];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    AngularMaterialModule,
    MatCheckboxModule,
  ],
  declarations: [TransactionTypeSettingsComponent, CreateUpdateTransactionTypeDialogComponent],
})
export class TransactionTypeSettingsModule {}
