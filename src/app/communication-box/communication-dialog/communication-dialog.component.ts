import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-communication-dialog',
  templateUrl: './communication-dialog.component.html',
  styleUrls: ['./communication-dialog.component.scss'],
})
export class CommunicationDialogComponent {
  constructor(private dialogRef: MatDialogRef<CommunicationDialogComponent>) {}

  closeDialog() {
    this.dialogRef.close();
  }
}
