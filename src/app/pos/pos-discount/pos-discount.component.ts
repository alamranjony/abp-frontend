import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SharedDataService } from '../shared-data.service';
import {
  DiscountApplicationType,
  DiscountDto,
  DiscountService,
  DiscountType,
} from '@proxy/discounts';
import { ToasterService } from '@abp/ng.theme.shared';
import { map, Observable, Subject, takeUntil } from 'rxjs';
import { OrderSummary } from '../models/order-summary.model';
import { CorporateSettingService } from '@proxy/corporate-settings';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { ValueService } from '@proxy/values';
import { LocalizationService } from '@abp/ng.core';

@Component({
  selector: 'app-pos-discount',
  templateUrl: './pos-discount.component.html',
  styleUrl: './pos-discount.component.scss',
})
export class PosDiscountComponent implements OnInit, OnDestroy {
  discountTypeEnum = DiscountType;
  totalDiscountAmount: number = 0;
  discountCodeInput: string;
  orderSummary: OrderSummary;
  isDiscountCodeInputFieldVisible$: Observable<boolean>;
  applicableDiscountCodes: DiscountDto[] = [];
  filteredDiscounts: DiscountDto[] = [];

  selectedDiscount$: Observable<DiscountDto>;
  amountPayable$: Observable<number>;
  orderSummary$: Observable<OrderSummary>;
  isDiscountOnOrderItemEnabled = false;

  isSalesTaxOnDelivery: boolean = false;
  isTaxOnRelay: boolean = false;
  corporateSalesTax: number = 0;
  totalSalesTax: number = 0;
  amountPaid$: Observable<string>;
  amountDue$: Observable<string>;
  deliveryFeeTotal$: Observable<number>;
  tipType: string;
  destroy$: Subject<void> = new Subject();
  discountType: string;

  constructor(
    public dialog: MatDialog,
    private sharedDataService: SharedDataService,
    private discountService: DiscountService,
    private toasterService: ToasterService,
    private corporateSettingService: CorporateSettingService,
    private localizationService: LocalizationService,
    private valueService: ValueService,
  ) {}

  ngOnInit(): void {
    this.isDiscountCodeInputFieldVisible$ = this.sharedDataService.orderSummary.pipe(
      map(x => x.totalDiscountOnItems > 0 || x.totalSubOrdersCount === 0),
    );

    this.selectedDiscount$ = this.sharedDataService.orderSummary.pipe(
      map(x => this.filteredDiscounts.find(y => y.id === x.appliedDiscountCodeId)),
    );

    this.sharedDataService.discountCodeClear$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.discountCodeInput = '';
    });

    this.orderSummary$ = this.sharedDataService.orderSummary;
    this.amountPayable$ = this.sharedDataService.orderSummary.pipe(map(x => x.amountPayable));
    this.amountPaid$ = this.sharedDataService.orderSummary.pipe(map(x => x.amountPaid));
    this.deliveryFeeTotal$ = this.sharedDataService.orderSummary.pipe(map(x => x.deliveryFeeTotal));

    this.getCorporateSetting();

    this.sharedDataService.orderSummary
      .pipe(takeUntil(this.destroy$))
      .subscribe((x: OrderSummary) => {
        this.orderSummary = x;
        this.totalSalesTax = x.taxAmount;
        if (x.discountApplicationType === DiscountApplicationType.Customer)
          this.clearDiscountDropdown();
        if (x.tipAmount > 0 && x.tipValueTypeId) {
          this.getTipType(x.tipValueTypeId);
        }
        this.discountType = this.getDiscountTypeLabel();
      });
  }

  getTipType(tipValueType: string) {
    this.valueService
      .get(tipValueType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.tipType = response.name;
        },
        error: () => {
          this.toasterService.error('::Tip:TypeError');
        },
      });
  }

  getDiscountTypeLabel(): string {
    const {
      totalDiscount,
      totalDiscountOnDeliveryFee,
      totalDiscountOnItems,
      totalDiscountOnOrder,
    } = this.orderSummary;

    if (totalDiscount <= 0) {
      return '';
    }

    const localized = this.localizationService.instant.bind(this.localizationService);

    if (totalDiscountOnDeliveryFee > 0) {
      return `(${localized('::Discounts:DiscountApplicationType:DeliveryFee')})`;
    }

    if (totalDiscountOnItems > 0) {
      return `(${localized('::Discounts:DiscountApplicationType:Item')})`;
    }

    if (totalDiscountOnOrder > 0) {
      return `(${localized('::Discounts:DiscountApplicationType:Order')})`;
    }

    return `(${localized('::OrderControl:Customer')})`;
  }

  clearDiscountDropdown(event?: MatAutocompleteSelectedEvent) {
    this.discountCodeInput = '';
    if (event) {
      event.option.value = '';
      event.option.deselect();
    }
    this.filteredDiscounts = [...this.filteredDiscounts];
  }

  getCorporateSetting() {
    this.corporateSettingService
      .getCorporateSetting()
      .pipe(takeUntil(this.destroy$))
      .subscribe(corporateSetting => {
        this.isDiscountOnOrderItemEnabled = corporateSetting.enableDiscountOnOrderItemSubtotal;
        this.getApplicableDiscountCodes();
        this.isSalesTaxOnDelivery = corporateSetting.taxOnDelivery;
        this.corporateSalesTax = corporateSetting.salesTaxPercentage;
        this.isTaxOnRelay = corporateSetting.taxOnRelay;
      });
  }

  getApplicableDiscountCodes() {
    this.discountService
      .getApplicableDiscountCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe(x => {
        this.applicableDiscountCodes = x.filter(
          y =>
            y.discountApplicationType == DiscountApplicationType.Order ||
            y.discountApplicationType == DiscountApplicationType.DeliveryFee ||
            (y.discountApplicationType == DiscountApplicationType.Item &&
              !this.isDiscountOnOrderItemEnabled),
        );
        this.filteredDiscounts = this.applicableDiscountCodes;
      });
  }

  onOptionSelected(event: MatAutocompleteSelectedEvent): void {
    let selectedDiscountCode = this.applicableDiscountCodes.find(
      discountCode => discountCode.discountCode === event.option.value,
    );

    if (!selectedDiscountCode) {
      this.clearDiscountDropdown(event);
      this.onDiscountCodeChange();
      return;
    }

    let totalDiscount = 0;
    let totalDiscountOnDeliveryFee = 0;
    let totalDiscountOnOrder = 0;
    let totalDiscountOnItems = 0;

    if (selectedDiscountCode.discountApplicationType === DiscountApplicationType.DeliveryFee) {
      if (selectedDiscountCode.discountType === DiscountType.Amount)
        totalDiscountOnDeliveryFee = selectedDiscountCode.discountAmount;
      if (selectedDiscountCode.discountType === DiscountType.Percentage)
        totalDiscountOnDeliveryFee =
          this.orderSummary.deliveryFeeTotal * (selectedDiscountCode.discountAmount / 100);

      if (this.orderSummary.deliveryFeeTotal === 0) {
        selectedDiscountCode = undefined;
        this.clearDiscountDropdown(event);
        this.onDiscountCodeChange();
        return;
      }

      if (totalDiscountOnDeliveryFee > this.orderSummary.deliveryFeeTotal) {
        selectedDiscountCode = undefined;
        this.toasterService.error('::Pos:DiscountLargerThanDeliveryFeeMessage');
        this.clearDiscountDropdown(event);
        this.onDiscountCodeChange();
        return;
      }

      totalDiscount = totalDiscountOnDeliveryFee;
    } else if (selectedDiscountCode.discountApplicationType === DiscountApplicationType.Item) {
      if (selectedDiscountCode.discountType === DiscountType.Amount)
        totalDiscountOnItems = selectedDiscountCode.discountAmount;
      if (selectedDiscountCode.discountType === DiscountType.Percentage)
        totalDiscountOnItems =
          this.orderSummary.subTotal * (selectedDiscountCode.discountAmount / 100);

      if (totalDiscountOnItems > this.orderSummary.subTotal) {
        selectedDiscountCode = undefined;
        this.toasterService.error('::Pos:DiscountLargerThanSubtotalMessage');
        this.clearDiscountDropdown(event);
        this.onDiscountCodeChange();
        return;
      }

      totalDiscount = totalDiscountOnItems;
    } else {
      if (selectedDiscountCode.discountType === DiscountType.Amount)
        totalDiscountOnOrder = selectedDiscountCode.discountAmount;
      if (selectedDiscountCode.discountType === DiscountType.Percentage)
        totalDiscountOnOrder =
          (this.orderSummary.subTotal + this.orderSummary.deliveryFeeTotal) *
          (selectedDiscountCode.discountAmount / 100);

      if (totalDiscountOnOrder > this.orderSummary.total) {
        selectedDiscountCode = undefined;
        this.toasterService.error('::Pos:DiscountLargerThanTotalAmountMessage');
        this.clearDiscountDropdown(event);
        this.onDiscountCodeChange();
        return;
      }

      totalDiscount = totalDiscountOnOrder;
    }

    if (!this.sharedDataService.isDiscountCodeEligibleToApply(totalDiscount)) {
      selectedDiscountCode = undefined;
      this.toasterService.info('::Pos:DiscountLargerLessthanCustomerDiscountMessage');
      this.clearDiscountDropdown(event);
      this.onDiscountCodeChange();
      return;
    }

    if (totalDiscountOnOrder > 0) this.totalDiscountAmount = totalDiscountOnOrder;
    else if (totalDiscountOnDeliveryFee > 0) this.totalDiscountAmount = totalDiscountOnDeliveryFee;
    else if (totalDiscountOnItems > 0) this.totalDiscountAmount = totalDiscountOnItems;

    this.sharedDataService.applyDiscountCode(this.totalDiscountAmount, selectedDiscountCode);
  }

  onDiscountCodeChange() {
    this.filteredDiscounts = this.applicableDiscountCodes.filter(x =>
      x.discountCode.toLowerCase().includes(this.discountCodeInput.toLowerCase()),
    );

    if (
      !this.applicableDiscountCodes.some(
        x => x.discountCode.toLowerCase() === this.discountCodeInput.toLowerCase(),
      )
    ) {
      this.sharedDataService.clearDiscount();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
