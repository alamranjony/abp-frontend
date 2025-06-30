import { Component, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { GlobalSearchResultViewComponent } from '../global-search-result-view/global-search-result-view.component';
import { DIALOG_ENTER_ANIMATION_DURATION } from 'src/app/shared/dialog.constants';
import { FormsModule } from '@angular/forms';
import { LocalizationService } from '@abp/ng.core';
import { MatInputModule } from '@angular/material/input';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-global-search-bar',
  standalone: true,
  imports: [FormsModule, MatInputModule],
  templateUrl: './global-search-bar.component.html',
  styleUrls: ['./global-search-bar.component.scss'],
})
export class GlobalSearchBarComponent implements OnDestroy {
  searchText: string = '';
  searchFieldPlaceholder: string = '';
  destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private localizationService: LocalizationService,
  ) {
    this.searchFieldPlaceholder = this.localizationService.instant('::GlobalSearch:Search');
  }

  performSearch() {
    const dialogRef = this.dialog.open(GlobalSearchResultViewComponent, {
      width: '70%',
      height: '600px',
      data: { searchText: this.searchText },
      enterAnimationDuration: DIALOG_ENTER_ANIMATION_DURATION,
    });
    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.searchText = '';
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
