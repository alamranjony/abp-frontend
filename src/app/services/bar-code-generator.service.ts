import { Injectable } from '@angular/core';
import JsBarcode from 'jsbarcode';

@Injectable({
  providedIn: 'root',
})
export class BarcodeGeneratorService {
  generateBarcodeBase64(rawData: string): string {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, rawData, {
      format: 'CODE128',
      displayValue: false,
      width: 2,
      height: 50,
      margin: 10,
    });
    return canvas.toDataURL('image/png');
  }
}
