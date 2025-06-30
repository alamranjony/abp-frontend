import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PosTipPopupComponent } from '../pos-tip-popup/pos-tip-popup.component';
import {
  DIALOG_ENTER_ANIMATION_DURATION,
  DIALOG_EXIT_ANIMATION_DURATION,
} from '../../shared/dialog.constants';
import { SharedDataService } from '../shared-data.service';

@Component({
  selector: 'app-pos-tip',
  templateUrl: './pos-tip.component.html',
  styleUrl: './pos-tip.component.scss',
})
export class PosTipComponent implements OnInit {
  isTipApplied: boolean = false;
  isRemovingTip: boolean = false;

  constructor(
    private matDialog: MatDialog,
    private sharedDataService: SharedDataService,
  ) {}

  ngOnInit(): void {
    this.sharedDataService.tipApplied$.subscribe(isApplied => {
      this.isTipApplied = isApplied;
    });
  }

  openTipPopup() {
    const dialogRef = this.matDialog.open(PosTipPopupComponent, {
      width: '600px',
      enterAnimationDuration: DIALOG_ENTER_ANIMATION_DURATION,
      exitAnimationDuration: DIALOG_EXIT_ANIMATION_DURATION,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.sharedDataService.applyTip(result.tipAmount, result.tipValueTypeId);
      }
    });
  }

  removeTip() {
    this.isRemovingTip = true;
    setTimeout(() => {
      this.isRemovingTip = false;
      this.sharedDataService.clearTip();
    }, 500);
  }
}
