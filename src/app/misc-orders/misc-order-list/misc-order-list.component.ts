import { ListResultDto, ListService, PagedResultDto } from '@abp/ng.core';
import { ToasterService } from '@abp/ng.theme.shared';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { EmployeeLookupDto, EmployeeService } from '@proxy/employees';
import {
  MiscOrderDto,
  MiscOrderService,
  MiscOrderType,
  miscOrderTypeOptions,
} from '@proxy/misc-orders';
import { StoreLookupDto, StoreService } from '@proxy/stores';
import { ValueTypeSettingService } from '@proxy/value-type-settings';
import { OrderSettingsDto } from '@proxy/value-type-settings/orders';
import { ValueDto, ValuePagedAndSortedResultRequestDto, ValueService } from '@proxy/values';
import { Subject, takeUntil } from 'rxjs';
import { sortEnumValues } from 'src/app/shared/common-utils';

@Component({
  selector: 'app-misc-order-list',
  templateUrl: './misc-order-list.component.html',
  styleUrl: './misc-order-list.component.scss',
  providers: [ListService],
})
export class MiscOrderListComponent implements OnInit, OnDestroy {
  filterForm: FormGroup;
  miscOrderList = { items: [], totalCount: 0 } as PagedResultDto<MiscOrderDto>;
  displayedColumns: string[] = [
    'creationTime',
    'employeeName',
    'storeName',
    'orderTypeId',
    'reasonName',
    'amount',
    'description',
  ];
  fromDate: string;
  toDate: string;
  miscOrderTypes = sortEnumValues(miscOrderTypeOptions);
  miscReasons: ValueDto[] = [];
  orderValueTypeSettings: OrderSettingsDto;
  storeList: StoreLookupDto[];
  employees: ListResultDto<EmployeeLookupDto>;
  enumValueForAllValueOrders = '0';
  private destroy$: Subject<void> = new Subject();

  constructor(
    private miscOrderService: MiscOrderService,
    readonly list: ListService,
    private fb: FormBuilder,
    private toasterService: ToasterService,
    private valueService: ValueService,
    private valueTypeSettingService: ValueTypeSettingService,
    private storeService: StoreService,
    private employeeService: EmployeeService,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadMiscOrders();
    this.loadMiscReason();
    this.getStores();
    this.getEmployees();
  }

  private loadMiscOrders() {
    const filterFormValue = this.filterForm.value;

    this.list
      .hookToQuery(query =>
        this.miscOrderService.getList({
          ...query,
          fromDate: this.fromDate,
          toDate: this.toDate,
          miscOrderType:
            filterFormValue?.miscOrderType !== this.enumValueForAllValueOrders
              ? filterFormValue?.miscOrderType
              : null,
          reasonId:
            filterFormValue?.reasonId !== this.enumValueForAllValueOrders
              ? filterFormValue?.reasonId
              : null,
          stores: filterFormValue?.stores,
          employees: filterFormValue?.employees,
        }),
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.miscOrderList = response;
      });
  }

  getEmployees() {
    this.employeeService
      .getEmployeeLookup()
      .pipe(takeUntil(this.destroy$))
      .subscribe(employees => {
        this.employees = employees;
      });
  }

  private getStores() {
    this.storeService
      .getStoreLookup()
      .pipe(takeUntil(this.destroy$))
      .subscribe(store => {
        this.storeList = store.items;
      });
  }

  changePage(pageEvent: PageEvent) {
    this.list.page = pageEvent.pageIndex;
    this.loadMiscOrders();
  }

  changeSort(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
    this.loadMiscOrders();
  }

  onSearch() {
    if (this.filterForm.valid) {
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

      this.list.page = 0;
      this.loadMiscOrders();
    }
  }

  private loadMiscReason() {
    this.valueTypeSettingService
      .getOrderValueTypeSetting()
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.orderValueTypeSettings = response;
      });
  }

  onOrderTypeChange(selectedOrderType): void {
    if (selectedOrderType === this.enumValueForAllValueOrders) return;

    const miscReasonTypeId =
      selectedOrderType === MiscOrderType.MiscIncome
        ? this.orderValueTypeSettings.miscIncomeReason
        : this.orderValueTypeSettings.paidOutReason;

    this.getValues(miscReasonTypeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.assignMiscReasons(response);
      });
  }

  private assignMiscReasons(response: PagedResultDto<ValueDto>) {
    this.miscReasons = response.items;
    this.processPreSelection();
  }

  private processPreSelection(): void {
    const preselectedReason = this.miscReasons.find(e => e.isPreSelect);
    if (preselectedReason) {
      this.filterForm.patchValue({ reasonId: preselectedReason.id });
    }
  }

  private getValues(miscReasonTypeId: string) {
    return this.valueService.getList({
      valueTypeId: miscReasonTypeId,
    } as ValuePagedAndSortedResultRequestDto);
  }

  private buildForm(): void {
    this.filterForm = this.fb.group({
      fromDate: [''],
      toDate: [''],
      miscOrderType: [''],
      reasonId: [''],
      stores: [''],
      employees: [''],
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
