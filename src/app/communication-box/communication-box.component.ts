import { Component, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CommunicationDialogComponent } from './communication-dialog/communication-dialog.component';
import {
  DIALOG_ENTER_ANIMATION_DURATION,
  DIALOG_EXIT_ANIMATION_DURATION,
} from '../shared/dialog.constants';
import { MessageService } from '@proxy/messages';
import { Subject, switchMap, takeUntil, timer } from 'rxjs';

@Component({
  selector: 'app-communication-box',
  standalone: false,
  template: `
    <button mat-icon-button (click)="openCommunicationDialog()">
      <mat-icon
        [matBadge]="unreadCount()"
        [matBadgeHidden]="unreadCount() === 0"
        matBadgeColor="warn"
        >mail
      </mat-icon>
    </button>
  `,
  styles: `
    .mat-badge-content {
      font-size: 10px;
    }
  `,
})
export class CommunicationBoxComponent implements OnInit, OnDestroy {
  unreadCount = signal(0);
  private intervalInMs = 60000 as const;
  private destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.startUnreadCountPolling();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openCommunicationDialog(): void {
    const dialogRef = this.dialog.open(CommunicationDialogComponent, {
      width: '65%',
      height: '75%',
      panelClass: 'communication-dialog-container',
      autoFocus: false,
      enterAnimationDuration: DIALOG_ENTER_ANIMATION_DURATION,
      exitAnimationDuration: DIALOG_EXIT_ANIMATION_DURATION,
      disableClose: true,
    });
  }

  private startUnreadCountPolling(): void {
    timer(0, this.intervalInMs)
      .pipe(
        switchMap(() => this.messageService.getUnreadMessagesCount()),
        takeUntil(this.destroy$),
      )
      .subscribe(count => {
        this.unreadCount.set(count);
      });
  }
}
