import { ToasterService } from '@abp/ng.theme.shared';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmployeeLookupDto, EmployeeService } from '@proxy/employees';
import { OrderType, orderTypeOptions } from '@proxy/orders';
import { InputFilterDto } from '@proxy/reports';
import { StoreLookupDto, StoreService } from '@proxy/stores';
import { Subject, takeUntil } from 'rxjs';
import { SalesRepProductivityDetailReportService } from 'src/app/services/reports/sales-rep-productivity-detail-report.service';

@Component({
  selector: 'app-sales-rep-productivity-detail-report',
  templateUrl: './sales-rep-productivity-detail-report.component.html',
  styleUrl: './sales-rep-productivity-detail-report.component.scss',
})
export class SalesRepProductivityDetailReportComponent implements OnInit, OnDestroy {
  filterForm: FormGroup;
  fromDate: string;
  toDate: string;
  destroy$ = new Subject<void>();
  storeList: StoreLookupDto[];
  employeeList: EmployeeLookupDto[];
  orderType = orderTypeOptions.map(option => ({
    key: option.value,
    value: option.key,
  }));

  constructor(
    private fb: FormBuilder,
    private toasterService: ToasterService,
    private salesRepService: SalesRepProductivityDetailReportService,
    private storeService: StoreService,
    private employeeService: EmployeeService,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.getStores();
    this.getEmployees();
  }

  getStores() {
    this.storeService
      .getStoreLookup()
      .pipe(takeUntil(this.destroy$))
      .subscribe(store => {
        this.storeList = store.items;
      });
  }

  getEmployees() {
    this.employeeService
      .getEmployeeLookup()
      .pipe(takeUntil(this.destroy$))
      .subscribe(employees => {
        this.employeeList = employees.items;
      });
  }

  onReportGenerate() {
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

    const selectedOrderTypesKeys = this.filterForm.value.ordertypes.filter((selectedKey: number) =>
      Object.values(OrderType).includes(selectedKey),
    );

    const selectedOrderTypesValues = this.orderType
      .filter(option => selectedOrderTypesKeys.includes(option.key))
      .map(option => option.value);

    const selectedStores = this.storeList
      .filter(c => this.filterForm.value.stores.includes(c.id))
      ?.map(c => c.storeName);

    const selectedEmployees = this.employeeList
      .filter(e => this.filterForm.value.employees.includes(e.employeeId))
      ?.map(e => e.displayName);

    const input = {
      fromDate: this.fromDate,
      toDate: this.toDate,
      stores: this.filterForm.value.stores,
      employees: this.filterForm.value.employees,
      orderTypes: selectedOrderTypesKeys,
      totalSubOrderAmount: this.filterForm.value.mdseOrTotal,
    } as InputFilterDto;

    const selectedAmount = this.filterForm.value.mdseOrTotal as number;

    this.salesRepService.generateReport(
      input,
      selectedStores,
      selectedEmployees,
      selectedOrderTypesValues,
      selectedAmount,
    );
  }

  private buildForm(): void {
    const today = new Date();
    this.filterForm = this.fb.group({
      fromDate: [today, Validators.required],
      toDate: [today, Validators.required],
      stores: [[]],
      employees: [[]],
      ordertypes: [[]],
      mdseOrTotal: [null],
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
