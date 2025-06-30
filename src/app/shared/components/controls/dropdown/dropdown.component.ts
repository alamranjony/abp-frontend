import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { startWith, map, debounceTime } from 'rxjs';
import { DEBOUNCE_TIME } from 'src/app/shared/constants';

@Component({
  selector: 'app-dropdown',
  templateUrl: './dropdown.component.html',
  styleUrl: './dropdown.component.scss',
})
export class DropdownComponent implements OnInit, OnChanges {
  @Input() label: string = 'Select';
  @Input() placeholder: string = 'Search...';
  @Input() options: any[] = [];
  @Input() displayField: string = '';
  @Input() valueField: string = '';
  @Input() control = new FormControl('');
  @Input() tabIndex: number = 0;
  @Output() selectionChangeEvent = new EventEmitter<any>();

  filteredOptions: any[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    const optionsChange = changes['options'];
    if (optionsChange && optionsChange.currentValue) {
      this.options = optionsChange.currentValue;
      this.filteredOptions = optionsChange.currentValue;
      const selectedValue = this.control.value;
      if (selectedValue) {
        const selectedOption = this.options.find(opt => opt[this.valueField] === selectedValue);
        if (selectedOption) {
          this.control.setValue(selectedOption[this.valueField]);
          this.filteredOptions = this.options;
        } else {
          this.control.setValue('');
        }
      }
    }
  }

  ngOnInit() {
    this.control.valueChanges
      .pipe(
        startWith(''),
        debounceTime(DEBOUNCE_TIME),
        map(value => {
          return typeof value === 'string' ? value : this._getDisplayValue(value);
        }),
        map(name => this._filter(name)),
      )
      .subscribe(filtered => {
        this.filteredOptions = filtered;
      });
  }

  private _filter(value: string): any[] {
    if (!this.options) return [];

    const filterValue = value.toLowerCase();
    return this.options.filter(option =>
      this._getDisplayValue(option).toLowerCase().includes(filterValue),
    );
  }

  displayFn(value: any): string {
    if (!value || !this.options?.length) return '';

    const matched = this.options.find(opt => opt[this.valueField] === value);
    return matched ? matched[this.displayField] : '';
  }

  private _getDisplayValue(option: any): string {
    if (!option) return '';

    if (typeof option === 'string') return option;

    return option[this.displayField];
  }

  onSelectionChanged(selectedId: any) {
    const selectedOption = this.options.find(opt => opt[this.valueField] === selectedId);
    this.selectionChangeEvent.emit(selectedOption);
  }

  clearSelection(input: HTMLInputElement) {
    this.control.setValue('');
    this.filteredOptions = this.options;
    input.focus();
    this.selectionChangeEvent.emit(null);
  }
}
