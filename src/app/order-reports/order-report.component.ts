import { ToasterService } from '@abp/ng.theme.shared';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  FilterPagedAndSortedOrderControlListResultRequestDto,
  orderStatusOptions,
} from '@proxy/orders';
import { ProductDto, ProductService } from '@proxy/products';
import { StoreLookupDto, StoreService } from '@proxy/stores';
import { PdfGeneratorService } from '../services/pdf-generator.service';
import { Subject, takeUntil } from 'rxjs';
import { sortEnumValues } from '../shared/common-utils';

@Component({
  selector: 'app-order-report',
  templateUrl: './order-report.component.html',
  styleUrl: './order-report.component.scss',
})
export class OrderReportComponent implements OnInit, OnDestroy {
  filterForm: FormGroup;
  orderStatus = sortEnumValues(orderStatusOptions);
  enumValueForAllValueOrders = '0';
  storeList: StoreLookupDto[];
  productInfo: ProductDto;
  fromDate: string;
  toDate: string;
  destroy$: Subject<void> = new Subject();

  constructor(
    private fb: FormBuilder,
    private toasterService: ToasterService,
    private storeService: StoreService,
    private productService: ProductService,
    private pdfGeneratorService: PdfGeneratorService,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.getStores();
    this.getProductInfos();
  }

  getStores() {
    this.storeService
      .getStoreLookup()
      .pipe(takeUntil(this.destroy$))
      .subscribe(store => {
        this.storeList = store.items;
      });
  }

  getProductInfos() {
    this.productService
      .getProductDtoValues()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: result => (this.productInfo = result),
        error: (this.productInfo = null),
      });
  }

  onReportGenerate() {
    if (this.filterForm.invalid) {
      this.toasterService.error('::OrderReport:FormValidation');
      return;
    }

    const fromDateValue = this.filterForm.value.fromDate
      ? new Date(this.filterForm.value.fromDate)
      : null;

    const toDateValue = this.filterForm.value.toDate
      ? new Date(this.filterForm.value.toDate)
      : null;

    if (fromDateValue && toDateValue && fromDateValue > toDateValue) {
      this.toasterService.error('::OrderControl:DateValidation');
      return;
    }

    this.fromDate = fromDateValue ? fromDateValue.toDateString() : null;
    this.toDate = toDateValue ? toDateValue.toDateString() : null;

    const input = {
      orderStatus:
        this.filterForm.value.orderStatus !== this.enumValueForAllValueOrders
          ? this.filterForm.value.orderStatus
          : undefined,
      productTypes: this.filterForm.value.productTypes,
      productDepartments: this.filterForm.value.productDepartments,
      stores: this.filterForm.value.stores,
      fromDate: this.fromDate,
      toDate: this.toDate,
      keyword: this.filterForm.value.keyword?.trim(),
    } as FilterPagedAndSortedOrderControlListResultRequestDto;

    const selectedProductTypes = this.productInfo?.availableProductTypes
      .filter(c => this.filterForm.value.productTypes.includes(c.id))
      ?.map(c => c.name);

    const selectedProductDepartments = this.productInfo?.availableDepartments
      .filter(c => this.filterForm.value.productDepartments.includes(c.id))
      ?.map(c => c.name);

    const selectedStores = this.storeList
      .filter(c => this.filterForm.value.stores.includes(c.id))
      ?.map(c => c.storeName);

    this.pdfGeneratorService.generateOrderReport(
      input,
      selectedProductTypes,
      selectedProductDepartments,
      selectedStores,
    );
  }

  private buildForm(): void {
    const today = new Date();
    const lastWeekDate = new Date();
    lastWeekDate.setDate(today.getDate() - 7);

    this.filterForm = this.fb.group({
      fromDate: [lastWeekDate, Validators.required],
      toDate: [today, Validators.required],
      orderStatus: [this.enumValueForAllValueOrders],
      productTypes: [[]],
      productDepartments: [[]],
      stores: [[]],
      keyword: [''],
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
