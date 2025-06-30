import { Directive, Output, EventEmitter, HostListener, ElementRef, OnInit } from '@angular/core';
import { BARCODE_SCANNER_DEBOUNCE_TIME } from '../constants';

@Directive({
  selector: '[appBarcodeScanner]',
})
export class BarcodeScannerDirective implements OnInit {
  @Output() barcodeDetected = new EventEmitter<string>();

  private barcodeText: string = '';
  private lastKeyTime: number = 0;

  constructor(private elRef: ElementRef<HTMLInputElement>) {}

  ngOnInit(): void {
    setTimeout(() => this.elRef.nativeElement.focus(), 0);
  }

  @HostListener('window:keypress', ['$event'])
  onKeyPress(event: KeyboardEvent) {
    const currentTime = Date.now();

    if (currentTime - this.lastKeyTime > BARCODE_SCANNER_DEBOUNCE_TIME) {
      this.barcodeText = '';
    }

    this.lastKeyTime = currentTime;
    const isChar = event.key.length === 1 && event.key !== '';

    if (isChar) {
      this.barcodeText += event.key;
    } else if (event.key === 'Enter') {
      const result = this.barcodeText.trim();
      if (!result) {
        this.barcodeText = '';
        return;
      }

      this.barcodeDetected.emit(result);
    }
  }
}
