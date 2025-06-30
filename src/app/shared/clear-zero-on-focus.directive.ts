import { Directive, HostListener, ElementRef, Optional } from '@angular/core';
import { NgControl } from '@angular/forms';
import { DATA_IGNORE_CLEAR_ZERO } from './constants';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'input[type=number]',
})
export class ClearZeroOnFocusDirective {
  constructor(
    private el: ElementRef,
    @Optional() private control: NgControl,
  ) {}

  @HostListener('focus')
  onFocus() {
    if (this.shouldIgnore()) return;

    const value = this.control ? this.control.control?.value : this.el.nativeElement.value;
    if (value === 0 || value === '0') {
      this.updateValue('');
    }
  }

  @HostListener('blur')
  onBlur() {
    if (this.shouldIgnore()) return;

    const value = this.control ? this.control.control?.value : this.el.nativeElement.value;
    if (!value) {
      this.updateValue(0);
    }
  }

  private updateValue(newValue: string | number) {
    if (this.control?.control) {
      this.control.control.setValue(newValue);
    } else {
      this.el.nativeElement.value = newValue;
    }
  }

  private shouldIgnore(): boolean {
    return this.el.nativeElement.hasAttribute(DATA_IGNORE_CLEAR_ZERO);
  }
}
