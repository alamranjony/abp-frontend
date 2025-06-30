import { DecimalPipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BatchPaymentSharedDataService {
  private leftOverAmount = new BehaviorSubject<number>(0);
  leftOverAmount$ = this.leftOverAmount.asObservable();

  private appliedAmount = new BehaviorSubject<number>(0);
  appliedAmount$ = this.appliedAmount.asObservable();

  constructor(private decimalPipe: DecimalPipe) {}

  setLeftOverAmount(amount: number) {
    this.leftOverAmount.next(amount);
  }

  setAppliedAmount(amount: number) {
    this.appliedAmount.next(amount);
  }

  clearLeftOverAmount() {
    this.leftOverAmount.next(0);
  }

  clearAppliedAmount() {
    this.appliedAmount.next(0);
  }

  toFixed(value: number): number {
    const valueInString = this.decimalPipe.transform(value, '1.2-2');

    if (valueInString !== undefined && valueInString !== null)
      return Number(valueInString.replace(/,/g, ''));

    return 0;
  }
}
