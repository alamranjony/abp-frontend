import { ListResultDto, LocalizationService } from '@abp/ng.core';
import { ToasterService } from '@abp/ng.theme.shared';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomerDto, CustomerService } from '@proxy/customers';
import {
  deliveryCategoryOptions,
  orderStatusOptions,
  orderTypeOptions,
  paymentStatusOptions,
} from '@proxy/orders';
import { ProductDto, ProductService, ProductLookupDto } from '@proxy/products';
import { EmployeeLookupDto, EmployeeService } from '@proxy/employees';
import { salesTypeOptions } from '@proxy/orders';
import {
  FilterDateCategory,
  filterDateCategoryOptions,
  ReportCategory,
  reportCategoryOptions,
} from '@proxy/reports';
import { StoreLookupDto, StoreService } from '@proxy/stores';
import { concatMap, Subject, takeUntil } from 'rxjs';
import { DateRangeType } from 'src/app/models/date-range-type';
import { ReportFilterConfigDto } from 'src/app/models/report-filter-config-dto';
import { ReportFilterDto } from 'src/app/models/report-filter-dto';
import { ValueDto, ValueService } from '@proxy/values';
import { paymentMethodOptions } from '@proxy/payment';
import { occasionCodeOptions } from '@proxy/recipients';
import { sortEnumValues } from '../../common-utils';
import { ValueTypeSettingService } from '@proxy/value-type-settings';
import { OrderSettingsDto } from '@proxy/value-type-settings/orders';

@Component({
  selector: 'app-report-filters',
  templateUrl: './report-filters.component.html',
  styleUrl: './report-filters.component.scss',
})
export class ReportFiltersComponent implements OnInit, OnDestroy {
  @Input() reportFilterConfig = {} as ReportFilterConfigDto;
  @Input() orderTypes = sortEnumValues(orderTypeOptions);
  @Output() generateReportEvent = new EventEmitter<ReportFilterDto>();

  filterForm: FormGroup;
  selectedCustomer = {} as CustomerDto;
  storeList: StoreLookupDto[];
  productInfo: ProductDto;
  salesTypes = sortEnumValues(salesTypeOptions);
  reportCategories = sortEnumValues(reportCategoryOptions);
  reportFilterData = {} as ReportFilterDto;
  products: ListResultDto<ProductLookupDto>;
  customers: CustomerDto[] = [];
  salesPersons: ListResultDto<EmployeeLookupDto>;
  destroy$ = new Subject<void>();
  employeeClasses: ValueDto[];
  filterDateCategory = sortEnumValues(filterDateCategoryOptions);
  orderStatus = sortEnumValues(orderStatusOptions);
  paymentStatus = sortEnumValues(paymentStatusOptions);
  occasions = sortEnumValues(occasionCodeOptions);
  deliveryCategories = sortEnumValues(deliveryCategoryOptions);
  allSelectionValueForEnum = '0';
  paymentMethods = sortEnumValues(paymentMethodOptions);
  cancelReasons: ValueDto[] = [];
  replacementReasons: ValueDto[] = [];

  constructor(
    private fb: FormBuilder,
    private toasterService: ToasterService,
    private customerService: CustomerService,
    private storeService: StoreService,
    private productService: ProductService,
    private readonly localizationService: LocalizationService,
    private employeeService: EmployeeService,
    private valueTypeSettingsService: ValueTypeSettingService,
    private valueService: ValueService,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.fetchData();
  }

  fetchData() {
    const {
      hasCustomerClass,
      hasStores,
      hasProductDepartments,
      hasProductTypes,
      hasProducts,
      hasCustomers,
      hasSalesPerson,
      hasEmployeeClass,
      hasCancellationReason,
      hasReplacementReason,
    } = this.reportFilterConfig;

    if (hasCustomerClass) this.loadCustomerDto();
    if (hasStores) this.getStores();
    if (hasProductDepartments || hasProductTypes) this.getProductInfos();
    if (hasProducts) this.getProductAutoCompleteList();
    if (hasCustomers) this.getCustomers();
    if (hasSalesPerson) this.getSalesPersons();
    if (hasEmployeeClass) this.getEmployeeClasses();
    if (hasCancellationReason) this.getCancellationReasons();
    if (hasReplacementReason) this.getReplacementReasons();
  }

  loadCustomerDto() {
    this.customerService
      .getCustomerDtoValues()
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        this.selectedCustomer = res;
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

  getProductInfos() {
    this.productService
      .getProductDtoValues()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: result => (this.productInfo = result),
        error: (this.productInfo = null),
      });
  }

  getProductAutoCompleteList() {
    this.productService
      .getAutoCompleteList(null)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: result => (this.products = result),
        error: (this.products = null),
      });
  }

  getCustomers() {
    this.customerService
      .fetchCustomerDtos()
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.customers = response;
      });
  }

  getSalesPersons() {
    this.employeeService
      .getEmployeeLookup()
      .pipe(takeUntil(this.destroy$))
      .subscribe(employees => {
        this.salesPersons = employees;
      });
  }

  getEmployeeClasses() {
    this.employeeService
      .getEmployeeValueTypeList()
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        const { departmentList } = res;
        this.employeeClasses = departmentList;
      });
  }

  getCancellationReasons() {
    this.valueTypeSettingsService
      .getOrderValueTypeSetting()
      .pipe(
        takeUntil(this.destroy$),
        concatMap((orderSettingsDto: OrderSettingsDto) =>
          this.valueService.getValuesByValueTypeId(orderSettingsDto.cancelSaleReason),
        ),
      )
      .subscribe(response => {
        this.cancelReasons = response;
      });
  }

  getReplacementReasons() {
    this.valueTypeSettingsService
      .getOrderValueTypeSetting()
      .pipe(
        takeUntil(this.destroy$),
        concatMap((orderSettingsDto: OrderSettingsDto) =>
          this.valueService.getValuesByValueTypeId(orderSettingsDto.replacementReason),
        ),
      )
      .subscribe(response => {
        this.replacementReasons = response;
      });
  }

  onReportGenerate() {
    if (this.filterForm.invalid) {
      this.toasterService.error('::OrderReport:FormValidation');
      return;
    }

    const {
      hasReportCategory,
      hasIncludePrice,
      hasReportTitle,
      hasOverallTotalsOnly,
      hasPrintByTypeOnly,
      hasGMPercentageRange,
      hasNumberToRank,
      hasDateCriteria,
      hasSearchOptions,
      hasOrderStatus,
      hasPaymentMethod,
      hasPaymentStatus,
      hasOccasion,
      hasDeliveryType,
    } = this.reportFilterConfig;
    const formData = this.filterForm.value;

    if (!this.handleDateFilters(formData)) return;
    if (!this.handlePriceRangeFilters(formData)) return;

    this.handleCustomerClassFilters(formData);
    this.handleProductFilters(formData);
    this.handleStoreFilters(formData);
    this.handleSalesTypeFilters(formData);
    this.handleProductDataFilters(formData);
    this.handleCustomerFilters(formData);
    this.handleSalesPersonFilters(formData);
    this.handleOrderTypeFilters(formData);
    this.handleProductDataFilters(formData);
    this.handleEmployeeClassFilters(formData);
    this.handleCancellationReasonFilters(formData);
    this.handleReplacementReasonFilters(formData);

    if (hasReportCategory) this.reportFilterData.reportCategory = formData.reportCategory;
    if (hasIncludePrice) this.reportFilterData.isIncludePrice = formData.isIncludePrice;
    if (hasReportTitle) this.reportFilterData.reportTitle = formData.reportTitle;
    if (hasOverallTotalsOnly)
      this.reportFilterData.isOverallTotalsOnly = formData.isOverallTotalsOnly;
    if (hasPrintByTypeOnly) this.reportFilterData.isPrintByTypeOnly = formData.isPrintByTypeOnly;
    if (hasGMPercentageRange) {
      this.reportFilterData.minRange = formData.minRange;
      this.reportFilterData.maxRange = formData.maxRange;
    }
    if (hasNumberToRank) this.reportFilterData.numberToRank = formData.numberToRank;
    if (hasDateCriteria) this.reportFilterData.filterDateCategory = formData.filterDateCategory;
    if (hasSearchOptions)
      this.reportFilterData.keyword = formData.keyword ? formData.keyword.trim() : null;
    if (hasOrderStatus)
      this.reportFilterData.orderStatus = this.parseEnumAllSelectedValue(formData.orderStatus);
    if (hasPaymentMethod)
      this.reportFilterData.paymentMethod = this.parseEnumAllSelectedValue(formData.paymentMethod);
    if (hasPaymentStatus)
      this.reportFilterData.paymentStatus = this.parseEnumAllSelectedValue(formData.paymentStatus);
    if (hasOccasion)
      this.reportFilterData.occasionCode = this.parseEnumAllSelectedValue(formData.occasionCode);
    if (hasDeliveryType)
      this.reportFilterData.deliveryType = this.parseEnumAllSelectedValue(formData.deliveryType);

    this.generateReportEvent.emit(this.reportFilterData);
  }

  private handleDateFilters(formData: any) {
    const { hasDateRange, hasSingleDate } = this.reportFilterConfig;

    if (hasDateRange) {
      if (!this.isValidDateRange()) {
        this.toasterService.error('::OrderControl:DateValidation');
        return false;
      }

      const firstDateRange: DateRangeType = formData.firstDateRangeGroup;
      const secondDateRange: DateRangeType = formData.secondDateRangeGroup;

      this.reportFilterData.firstDateRange = firstDateRange;
      this.reportFilterData.secondDateRange = secondDateRange;

      this.reportFilterData.fromDate = firstDateRange?.fromDate
        ? new Date(firstDateRange.fromDate).toDateString()
        : null;
      this.reportFilterData.toDate = secondDateRange?.toDate
        ? new Date(secondDateRange.toDate).toDateString()
        : null;
    }

    if (hasSingleDate) {
      const fromDateValue = formData.fromDate ? new Date(formData.fromDate) : null;
      const toDateValue = formData.toDate ? new Date(formData.toDate) : null;

      if (fromDateValue && toDateValue && fromDateValue > toDateValue) {
        this.toasterService.error('::OrderControl:DateValidation');
        return false;
      }

      this.reportFilterData.fromDate = fromDateValue ? fromDateValue.toDateString() : null;
      this.reportFilterData.toDate = toDateValue ? toDateValue.toDateString() : null;
    }

    return true;
  }

  private handleCustomerClassFilters(formData: any) {
    if (!this.reportFilterConfig.hasCustomerClass) return;

    this.reportFilterData.selectedCustomerClassIds = formData.customerClassList;
    this.reportFilterData.selectedCustomerClassNames = this.selectedCustomer.availableAcctClasses
      .filter(c => formData.customerClassList.includes(c.id))
      .map(c => c.name);
  }

  private handleProductFilters(formData: any) {
    const { hasProductTypes, hasProductDepartments } = this.reportFilterConfig;

    if (hasProductTypes) {
      this.reportFilterData.productTypeIds = formData.productTypes;
      this.reportFilterData.productTypeNames = this.productInfo?.availableProductTypes
        .filter(c => formData.productTypes.includes(c.id))
        .map(c => c.name);
    }

    if (hasProductDepartments) {
      this.reportFilterData.productDepartmentIds = formData.productDepartments;
      this.reportFilterData.productDepartmentNames = this.productInfo?.availableDepartments
        .filter(c => formData.productDepartments.includes(c.id))
        .map(c => c.name);
    }
  }

  private handleStoreFilters(formData: any) {
    if (!this.reportFilterConfig.hasStores) return;

    this.reportFilterData.storeIds = formData.stores;
    this.reportFilterData.storeNames = this.storeList
      .filter(c => formData.stores.includes(c.id))
      .map(c => c.storeName);
  }

  private handleSalesTypeFilters(formData: any) {
    if (!this.reportFilterConfig.hasSalesType) return;

    this.reportFilterData.salesTypeIds = formData.salesTypes;
    this.reportFilterData.salesTypeNames = formData.salesTypes.map(salesType =>
      this.localizationService.instant('::Enum:SalesType.' + salesType),
    );
  }

  private handleOrderTypeFilters(formData: any) {
    if (!this.reportFilterConfig.hasOrderType) return;

    this.reportFilterData.orderTypeIds = formData.orderTypes;
    this.reportFilterData.orderTypeNames = formData.orderTypes.map(orderType =>
      this.localizationService.instant('::Enum:OrderTypes.' + orderType),
    );
  }

  private handleCustomerFilters(formData: any) {
    if (!this.reportFilterConfig.hasCustomers) return;

    this.reportFilterData.customerIds = formData.customers;
    this.reportFilterData.customerNames = this.customers
      .filter(c => formData.customers.includes(c.id))
      .map(c => c.name);
  }

  private handleCancellationReasonFilters(formData: any) {
    if (!this.reportFilterConfig.hasCancellationReason) return;

    this.reportFilterData.cancellationReasonIds = formData.cancellationReasonIds;
    this.reportFilterData.cancellationReasonNames = this.cancelReasons
      .filter(c => formData.cancellationReasonIds.includes(c.id))
      .map(c => c.name);
  }

  private handleReplacementReasonFilters(formData: any) {
    if (!this.reportFilterConfig.hasReplacementReason) return;

    this.reportFilterData.replacementReasonIds = formData.replacementReasonIds;
    this.reportFilterData.replacementReasonNames = this.replacementReasons
      .filter(c => formData.replacementReasonIds.includes(c.id))
      .map(c => c.name);
  }

  private buildForm(): void {
    const today = new Date();
    const lastWeekDate = new Date();
    lastWeekDate.setDate(today.getDate() - 7);
    const nextWeekDate = new Date();
    nextWeekDate.setDate(today.getDate() + 7);

    this.filterForm = this.fb.group({
      firstDateRangeGroup: this.fb.group({
        fromDate: [lastWeekDate, Validators.required],
        toDate: [today, Validators.required],
      }),
      secondDateRangeGroup: this.fb.group({
        fromDate: [today, Validators.required],
        toDate: [nextWeekDate, Validators.required],
      }),
      customerClassList: [[]],
      fromDate: [lastWeekDate, Validators.required],
      toDate: [today, Validators.required],
      productTypes: [[]],
      productDepartments: [[]],
      stores: [[]],
      salesTypes: [[]],
      orderTypes: [[]],
      reportCategory: [ReportCategory.Summary, Validators.required],
      productIds: [[]],
      customers: [[]],
      isIncludePrice: [true],
      reportTitle: [''],
      salesPersons: [[]],
      isOverallTotalsOnly: [false],
      isPrintByTypeOnly: [false],
      minRange: [],
      maxRange: [],
      numberToRank: [],
      employeeClassList: [[]],
      filterDateCategory: [FilterDateCategory.OrderDate],
      maxPriceRange: [],
      minPriceRange: [],
      paymentMethod: [],
      paymentStatus: [],
      occasionCode: [],
      residenceType: [],
      orderStatus: [],
      deliveryType: [],
      keyword: [''],
      cancellationReasonIds: [[]],
      replacementReasonIds: [[]],
    });
  }

  private handleSalesPersonFilters(formData: any) {
    if (!this.reportFilterConfig.hasSalesPerson) return;

    this.reportFilterData.salesPersonIds = formData.salesPersons;
    this.reportFilterData.salesPersonNames = this.salesPersons?.items
      .filter(c => formData.salesPersons.includes(c.employeeId))
      .map(c => c.displayName);
  }

  private isValidDateRange(): boolean {
    const firstFromDate = this.filterForm.value.firstDateRangeGroup?.fromDate
      ? new Date(this.filterForm.value.firstDateRangeGroup.fromDate)
      : null;
    const firstToDate = this.filterForm.value.firstDateRangeGroup?.toDate
      ? new Date(this.filterForm.value.firstDateRangeGroup.toDate)
      : null;

    const secondFromDate = this.filterForm.value.secondDateRangeGroup?.fromDate
      ? new Date(this.filterForm.value.secondDateRangeGroup.fromDate)
      : null;
    const secondToDate = this.filterForm.value.secondDateRangeGroup?.toDate
      ? new Date(this.filterForm.value.secondDateRangeGroup.toDate)
      : null;

    if (firstFromDate && firstToDate && firstFromDate > firstToDate) return false;
    if (secondFromDate && secondToDate && secondFromDate > secondToDate) return false;
    if (firstToDate && secondFromDate && firstToDate > secondFromDate) return false;

    return true;
  }

  private handleProductDataFilters(formData: any) {
    if (!this.reportFilterConfig.hasProducts) return;

    this.reportFilterData.productIds = formData.productIds;
    this.reportFilterData.productNames = this.products?.items
      .filter(c => formData.productIds.includes(c.id))
      .map(c => c.name);
  }

  private handleEmployeeClassFilters(formData: any) {
    if (!this.reportFilterConfig.hasEmployeeClass) return;

    this.reportFilterData.employeeClassIds = formData.employeeClassList;
    this.reportFilterData.employeeClassNames = this.employeeClasses
      .filter(c => formData.employeeClassList.includes(c.id))
      .map(c => c.name);
  }

  parseEnumAllSelectedValue(selectedValue) {
    return selectedValue !== this.allSelectionValueForEnum ? selectedValue : null;
  }

  handlePriceRangeFilters(formData: any) {
    const { hasPriceRange } = this.reportFilterConfig;

    if (hasPriceRange) {
      const minPrice = formData.minPriceRange;
      const maxPrice = formData.maxPriceRange;

      if (
        (minPrice === undefined || minPrice === null) &&
        maxPrice !== undefined &&
        maxPrice !== null
      ) {
        this.toasterService.error('::Reports:Common:InvalidPriceRange');
        return false;
      }

      if (
        (maxPrice === undefined || maxPrice === null) &&
        minPrice !== undefined &&
        minPrice !== null
      ) {
        this.toasterService.error('::Reports:Common:InvalidPriceRange');
        return false;
      }

      if (minPrice !== undefined && maxPrice !== undefined && maxPrice < minPrice) {
        this.toasterService.error('::Reports:Common:SmallMaxPriceRange');
        return false;
      }

      this.reportFilterData.maxPriceRange = maxPrice;
      this.reportFilterData.minPriceRange = minPrice;
    }

    return true;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
