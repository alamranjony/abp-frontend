import { Component } from '@angular/core';

@Component({
  selector: 'app-empty-table-message',
  template: `
    <div class="empty-message">
      <mat-icon>info_outline</mat-icon>
      <span>{{ '::NoDataAvailable' | abpLocalization }}</span>
    </div>
  `,
  styles: [
    `
      .empty-message {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        height: 100%;
        color: rgba(0, 0, 0, 0.54);
        padding: 24px;
        text-align: center;
      }

      .empty-message mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        opacity: 0.6;
      }
    `,
  ],
})
export class EmptyTableMessageComponent {}
