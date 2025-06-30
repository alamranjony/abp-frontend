import { ListResultDto, ListService, PagedResultDto } from '@abp/ng.core';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import {
  DesignerOrderService,
  DesignerSubOrderControlListDto,
  DesignStatus,
  designStatusOptions,
  SubOrderDto,
} from '@proxy/orders';
import { Subject, takeUntil } from 'rxjs';
import { Sort } from '@angular/material/sort';
import { sortEnumValues } from '../shared/common-utils';
import { EmployeeLookupDto, EmployeeService } from '@proxy/employees';
import { ToasterService } from '@abp/ng.theme.shared';
import { LAST_WEEK_DURATION } from '../shared/constants';
import { MatDialog } from '@angular/material/dialog';
import { ChangeEmployeeDialogComponent } from './change-employee-dialog/change-employee-dialog.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-designer-order-control-list',
  templateUrl: './designer-order-control-list.component.html',
  styleUrls: ['./designer-order-control-list.component.scss'],
  providers: [ListService],
})
export class DesignerOrderControlListComponent implements OnInit, OnDestroy {
  filterForm: FormGroup;
  orderControlList = { items: [], totalCount: 0 } as PagedResultDto<DesignerSubOrderControlListDto>;
  displayedColumns: string[] = [
    'orderNumber',
    'designStatus',
    'recipientAddress',
    'productName',
    'assignedEmployee',
    'actions',
  ];

  designStatuses = sortEnumValues(designStatusOptions).filter(
    c => ![DesignStatus.Complete].includes(c.value),
  );
  employees: ListResultDto<EmployeeLookupDto>;
  enumValueForAllValueOrders = '0';
  designStatusEnum = DesignStatus;
  subOrderNo: string = '';
  isLoading: boolean = false;
  private destroy$: Subject<void> = new Subject();

  constructor(
    private designerOrderService: DesignerOrderService,
    private fb: FormBuilder,
    readonly list: ListService,
    private employeeService: EmployeeService,
    private toasterService: ToasterService,
    public dialog: MatDialog,
    private router: Router,
  ) {}

  ngOnInit() {
    this.buildForm();
    this.getEmployees();
    this.loadDesignerOrderList();
  }

  getEmployees() {
    this.employeeService
      .getEmployeeLookup()
      .pipe(takeUntil(this.destroy$))
      .subscribe(employees => {
        this.employees = employees;
      });
  }

  private buildForm(): void {
    const today = new Date();
    const lastWeekDate = new Date();
    lastWeekDate.setDate(today.getDate() - LAST_WEEK_DURATION);

    this.filterForm = this.fb.group({
      fromDate: [lastWeekDate],
      toDate: [today],
      designStatus: [this.enumValueForAllValueOrders],
      keyword: [''],
      assignedEmployees: [[]],
    });
  }

  onSearch() {
    if (this.filterForm.valid) {
      if (!this.validateDateRange()) return;

      this.list.page = 0;
      this.loadDesignerOrderList();
    }
  }

  changePage(pageEvent: PageEvent) {
    this.list.page = pageEvent.pageIndex;
    this.loadDesignerOrderList();
  }

  private loadDesignerOrderList() {
    const filterFormValue = this.filterForm.value;

    this.list
      .hookToQuery(query =>
        this.designerOrderService.getAllDesignerOrders({
          ...query,
          fromDate: new Date(filterFormValue.fromDate).toDateString(),
          toDate: new Date(filterFormValue.toDate).toDateString(),
          designStatus:
            filterFormValue.designStatus !== this.enumValueForAllValueOrders
              ? filterFormValue.designStatus
              : undefined,
          keyword: filterFormValue.keyword.trim(),
          assignedEmployees: filterFormValue.assignedEmployees,
        }),
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.orderControlList = response;
      });
  }

  changeSort(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
    this.loadDesignerOrderList();
  }

  private validateDateRange() {
    const filterFormValue = this.filterForm.value;

    const fromDateValue = new Date(filterFormValue.fromDate);
    const toDateValue = filterFormValue.toDate;

    if (fromDateValue > toDateValue) {
      this.toasterService.error('::OrderControl:DateValidation');
      return false;
    }

    return true;
  }

  onAssign(subOrderNo: string) {
    if (this.isLoading) return;

    const trimmedSubOrderNo = subOrderNo?.trim();
    if (!trimmedSubOrderNo) {
      this.toasterService.error('::DesignerOrder:SubOrderNoRequired');
      return;
    }

    this.subOrderNo = trimmedSubOrderNo;
    this.isLoading = true;
    this.designerOrderService
      .getAssignedAndCompletedSubOrder(this.subOrderNo.trim())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (subOrder: SubOrderDto) => {
          if (subOrder.designStatus === DesignStatus.Assigned)
            this.toasterService.success('::DesignerOrder:OrderAssigned');
          if (subOrder.designStatus === DesignStatus.Complete)
            this.toasterService.success('::DesignerOrder:OrderCompleted');
          this.loadDesignerOrderList();
          this.clear();
        },
        error: () => {
          this.clear();
        },
      });
  }

  clear() {
    this.isLoading = false;
    this.subOrderNo = '';
  }

  onChangeEmployee(subOrderNo: number, employeeId: string) {
    const dialogRef = this.dialog.open(ChangeEmployeeDialogComponent, {
      width: '30%',
      data: employeeId,
    });
    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;

      this.designerOrderService
        .changeAssignedEmployee(subOrderNo, result.employeeId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.toasterService.success('::DesignerOrder:EmployeeChanged');
          this.loadDesignerOrderList();
        });
    });
  }

  showDesignerDetails(subOrderNumber: number): void {
    const order = this.orderControlList.items.find(
      order => order.subOrderNumber === subOrderNumber,
    );

    this.router.navigate(['designer-order-list/designer-order-details', order.subOrderNumber]);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
