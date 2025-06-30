import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TimeClockComponent } from '../time-clock.component';

@Component({
  selector: 'app-top-bar-time-clock',
  templateUrl: './top-bar-time-clock.component.html',
  styleUrl: './top-bar-time-clock.component.scss',
})
export class TopBarTimeClockComponent {
  constructor(private readonly dialog: MatDialog) {}

  openModal() {
    this.dialog.open(TimeClockComponent, {
      width: '600px',
    });
  }
}
