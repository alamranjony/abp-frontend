import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CheckoutBoxDto, CheckoutBoxService } from '@proxy/checkout-box';
import { StoreLookupDto, StoreService } from '@proxy/stores';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { DEBOUNCE_TIME } from '../shared/constants';
import { Router } from '@angular/router';

@Component({
  selector: 'app-checkout-box',
  templateUrl: './checkout-box.component.html',
  styleUrl: './checkout-box.component.scss',
})
export class CheckoutBoxComponent implements OnInit, OnDestroy {
  filterForm: FormGroup;
  storeList: StoreLookupDto[];
  destroy$ = new Subject<void>();
  checkoutBoxList: CheckoutBoxDto[];
  displayedColumns: string[] = [
    'categoryType',
    'pastOrders',
    'todaysOrders',
    'futureOrders',
    'totalOrders',
  ];

  constructor(
    private fb: FormBuilder,
    private storeService: StoreService,
    private checkoutBoxService: CheckoutBoxService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.getStores();
    this.getCheckoutBoxList();

    this.filterForm
      .get('stores')
      ?.valueChanges.pipe(
        debounceTime(DEBOUNCE_TIME),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.getCheckoutBoxList();
      });
  }

  getStores() {
    this.storeService
      .getStoreLookup()
      .pipe(takeUntil(this.destroy$))
      .subscribe(store => {
        this.storeList = store.items;
      });
  }

  getCheckoutBoxList() {
    this.checkoutBoxService.getCheckOutBoxList(this.filterForm.value.stores).subscribe(list => {
      this.checkoutBoxList = list;
    });
  }

  private buildForm(): void {
    this.filterForm = this.fb.group({
      stores: [[]],
    });
  }

  onCategoryClick(element: CheckoutBoxDto): void {
    this.router.navigateByUrl('checkout-box/details', {
      state: { categoryType: element.categoryType, stores: this.filterForm.value.stores },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
