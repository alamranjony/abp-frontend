import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PrinterLookupDto } from '@proxy/print-node';
import { FormControl } from '@angular/forms';
import { EMPTY_GUID } from '../../shared/constants';

@Component({
  selector: 'app-printer-tray-selector',
  templateUrl: './printer-tray-selector.component.html',
  styleUrl: './printer-tray-selector.component.scss',
})
export class PrinterTraySelectorComponent {
  @Input() label!: string;
  @Input() printers: PrinterLookupDto[] = [];
  @Input() trayOptions: string[] = [];
  @Input() printerControl!: FormControl;
  @Input() trayControl!: FormControl;
  @Output() printerChanged = new EventEmitter<string | null>();

  protected readonly EMPTY_GUID = EMPTY_GUID;

  onPrinterChange(printerId: string | null): void {
    this.printerChanged.emit(printerId);
  }
}
