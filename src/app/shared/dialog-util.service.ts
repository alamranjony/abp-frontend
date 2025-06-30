import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  DIALOG_ENTER_ANIMATION_DURATION,
  DIALOG_EXIT_ANIMATION_DURATION,
} from './dialog.constants';
import { ComponentType } from '@angular/cdk/portal';

@Injectable({
  providedIn: 'root',
})
export class DialogUtilService {
  constructor(private dialog: MatDialog) {}

  openDialog<T, R = any>(component: ComponentType<T>, data: any): MatDialogRef<T, R> {
    return this.dialog.open(component, {
      width: '50%',
      data: data,
      enterAnimationDuration: DIALOG_ENTER_ANIMATION_DURATION,
      exitAnimationDuration: DIALOG_EXIT_ANIMATION_DURATION,
    });
  }
}
