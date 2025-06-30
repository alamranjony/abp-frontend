import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appTimeFormat]',
})
export class TimeFormatDirective {
  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event']) onInputChange(event: Event) {
    let input = this.el.nativeElement.value;

    input = input.replace(/[^0-9:]/g, '');
    if (input.length > 2 && input.indexOf(':') === -1) {
      input = input.slice(0, 2) + ':' + input.slice(2);
    }

    this.el.nativeElement.value = input;
  }
}
