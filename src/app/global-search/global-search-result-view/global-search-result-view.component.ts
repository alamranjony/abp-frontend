import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AngularMaterialModule } from 'src/app/shared/angular-material/angular-material.module';
import * as moment from 'moment';
import {
  GlobalOrderSearchResultListItemDto,
  GlobalSearchPagedResultRequestDto,
  GlobalSearchService,
} from '@proxy/global-searches';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { Observable, Subject, takeUntil } from 'rxjs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Router } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { OrderService } from '@proxy/orders';
import { ConfigStateService, CurrentUserDto } from '@abp/ng.core';
import { OrderActionType } from 'src/app/order-control-list/models/order-action-type.enum';
import { ToasterService } from '@abp/ng.theme.shared';

@Component({
  selector: 'app-global-search-result-view',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    AngularMaterialModule,
    ScrollingModule,
    MatDatepickerModule,
    SharedModule,
  ],
  templateUrl: './global-search-result-view.component.html',
  styleUrls: ['./global-search-result-view.component.scss'],
})
export class GlobalSearchResultViewComponent implements OnInit, OnDestroy {
  orderSearchResults: GlobalOrderSearchResultListItemDto[] = [];
  defaultSearchRangeInDays: number = 7;
  filterDateFrom: Date = moment().subtract(this.defaultSearchRangeInDays, 'days').toDate();
  filterDateTo: Date = new Date();
  skipCount: number = 0;
  searchText: string;
  defaultMaxResultCount: number = 1000;

  orderSearchResults$: Observable<GlobalOrderSearchResultListItemDto[]>;
  currentUser: CurrentUserDto;
  destroy$: Subject<void> = new Subject();

  constructor(
    private dialogRef: MatDialogRef<GlobalSearchResultViewComponent>,
    private globalSearchService: GlobalSearchService,
    private toasterService: ToasterService,
    private orderService: OrderService,
    private router: Router,
    private configState: ConfigStateService,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      searchText: string;
    },
  ) {
    this.searchText = data.searchText;
    this.currentUser = this.configState.getOne('currentUser') as CurrentUserDto;
  }

  ngOnInit(): void {
    this.searchOnOrders();
  }

  onPickerClosed(): void {
    this.searchOnOrders();
  }

  searchOnOrders() {
    if (!this.searchText?.trim()) return;

    let requestDto: GlobalSearchPagedResultRequestDto = this.PrepareGlobalSearchPagedRequestDto();

    this.orderSearchResults$ =
      this.globalSearchService.getOrderSearchResultsByPagedResultRequestDto(requestDto);
  }

  private PrepareGlobalSearchPagedRequestDto(): GlobalSearchPagedResultRequestDto {
    return {
      searchText: this.searchText,
      maxResultCount: this.defaultMaxResultCount,
      filterDateFrom: this.filterDateFrom.toDateString(),
      filterDateTo: this.filterDateTo.toDateString(),
    };
  }

  goToOrderDetails(orderId: string) {
    this.orderService
      .assignUserToOrder(orderId, this.currentUser.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toasterService.warn('::OrderControl:UnassignedPreviousOrder');
          this.router.navigateByUrl('/pos', {
            state: { orderId: orderId, action: OrderActionType.OpenOrderInOrderEntry },
          });
          this.onDialogClose();
        },
        error: () => {
          this.toasterService.error('::OrderControl:ErrorWhileAssigningOrder');
        },
      });
  }

  onDialogClose() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
