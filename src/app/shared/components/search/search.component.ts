import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AngularMaterialModule } from '../../angular-material/angular-material.module';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { LocalizationService } from '@abp/ng.core';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [AngularMaterialModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
})
export class SearchComponent implements OnInit, OnDestroy {
  @Input() placeHolder: string = this.localizationService.instant('::Search');
  @Input() filter: string = '';
  @Output() filterChange: EventEmitter<string> = new EventEmitter();

  private searchSubject: Subject<string> = new Subject();

  constructor(private readonly localizationService: LocalizationService) {}

  ngOnInit(): void {
    this.searchSubject.pipe(debounceTime(500), distinctUntilChanged()).subscribe(searchText => {
      this.filterChange.emit(searchText);
    });
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  onSearch() {
    this.searchSubject.next(this.filter);
  }

  onClearSearch() {
    this.filter = '';
    this.filterChange.emit(this.filter);
    this.searchSubject.next(this.filter);
  }
}
