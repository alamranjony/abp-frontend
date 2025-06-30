import { LocalizationService } from '@abp/ng.core';
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
import { debounceTime, map, Observable, startWith } from 'rxjs';

@Component({
  selector: 'app-multi-select-dropdown',
  templateUrl: './multi-select-dropdown.component.html',
  styleUrl: './multi-select-dropdown.component.scss',
})
export class MultiSelectDropdownComponent implements OnInit, OnChanges {
  @Input() label = 'Select Options';
  @Input() placeHolder = 'Search...';
  @Input() options: any[] = [];
  @Input() idField = 'id';
  @Input() nameField = 'name';
  @Input() control = new FormControl([]);
  @Input() hasLocalizationDisplayName: boolean;
  @Input() displayNameLocalizationKey: string;
  @Output() selectionChange = new EventEmitter<any[]>();

  searchControl = new FormControl('');
  filteredOptions!: Observable<any[]>;

  displayedItemNames: string[] = [];
  displayedItemIds: any[] = [];
  remainingCount = 0;

  constructor(private readonly localizationService: LocalizationService) {}

  ngOnInit() {
    this.updateFilterOptions();

    this.control.valueChanges.subscribe(() => {
      this.updateChips();
    });

    this.updateChips();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['options'] && !changes['options'].firstChange) {
      this.updateFilterOptions();
    }

    if (changes['options'] || changes['control']) {
      this.updateChips();
    }
  }

  getFilteredOptions(searchText: string): any[] {
    if (!this.options) return [];

    const selectedIds = this.currentSelection;
    return this.options.filter(
      item =>
        !selectedIds.includes(item[this.idField]) &&
        item[this.nameField].toLowerCase().includes(searchText.toLowerCase()),
    );
  }

  get currentSelection(): any[] {
    return this.control.value || [];
  }

  addSelection(id: any) {
    const currentSelection = this.currentSelection;
    if (!currentSelection.includes(id)) {
      this.control.setValue([...currentSelection, id]);
      this.selectionChange.emit(this.currentSelection);
    }
    this.searchControl.setValue('');
  }

  removeSelection(id: any) {
    const currentSelection = this.currentSelection;
    const updatedSelection = currentSelection.filter((item: any) => item !== id);
    this.control.setValue(updatedSelection);
    this.selectionChange.emit(updatedSelection);

    this.updateFilterOptions();
    this.updateChips();
  }

  private updateFilterOptions() {
    this.filteredOptions = this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      map(searchText => this.getFilteredOptions(searchText)),
    );
  }

  private updateChips() {
    if (!this.options) return [];

    const selected = this.currentSelection;
    const selectedItems = this.options.filter(item => selected.includes(item[this.idField]));

    const displayedItems = selectedItems.slice(0, 3);
    this.displayedItemNames = this.hasLocalizationDisplayName
      ? displayedItems.map(item =>
          this.localizationService.instant(this.displayNameLocalizationKey + item[this.idField]),
        )
      : displayedItems.map(item => item[this.nameField]);

    this.displayedItemIds = displayedItems.map(item => item[this.idField]);

    this.remainingCount = selected.length - 3;
  }
}
