import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardDesignSettingComponent } from './card-design-setting.component';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ColorPickerModule } from 'ngx-color-picker';

const routes: Routes = [{ path: '', component: CardDesignSettingComponent }];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    SharedModule,
    MatFormFieldModule,
    ColorPickerModule,
  ],
  declarations: [CardDesignSettingComponent],
})
export class CardDesignSettingModule {}
