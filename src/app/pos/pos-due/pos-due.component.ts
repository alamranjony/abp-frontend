import { Component, OnInit } from '@angular/core';
import { map, Observable } from 'rxjs';
import { SharedDataService } from '../shared-data.service';
import { ReviewType, reviewTypeOptions } from '@proxy/orders';
import { sortEnumValues } from 'src/app/shared/common-utils';

@Component({
  selector: 'app-pos-due',
  templateUrl: './pos-due.component.html',
  styleUrl: './pos-due.component.scss',
})
export class PosDueComponent implements OnInit {
  amountDue$: Observable<string>;
  changeDue$: Observable<string>;
  selectedReviewType: ReviewType = null;
  reviewTypeOptions = sortEnumValues(reviewTypeOptions);
  constructor(private sharedDataService: SharedDataService) {}

  ngOnInit(): void {
    this.amountDue$ = this.sharedDataService.orderSummary.pipe(map(x => x.amountDue));
    this.changeDue$ = this.sharedDataService.orderSummary.pipe(map(x => x.changeDue));
  }

  onReviewTypeSelectionChange() {
    this.sharedDataService.updateReviewType(this.selectedReviewType);
    this.sharedDataService.broadcastOrderSummary();
  }
}
