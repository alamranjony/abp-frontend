import { ListService, LocalizationService, PagedResultDto, PermissionService } from '@abp/ng.core';
import { Confirmation, ConfirmationService, ToasterService } from '@abp/ng.theme.shared';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { CheckInOutDto, GetCheckInOutListDto } from '@proxy/check-in-outs';
import {
  EmployeeDto,
  EmployeeService,
  EmployeeSettingDto,
  EmployeeSettingService,
  PayrollFrequency,
} from '@proxy/employees';
import { PayrollService } from '@proxy/payrolls';
import { PayrollDialogComponent } from './payroll-dialog/payroll-dialog.component';
import { EXPORT_CONFIG } from '../export/export-config';
import { ImportComponent } from '../shared/components/import/import.component';
import { FilterPagedAndSortedResultRequestDto } from '@proxy/shared';
import { FormBuilder, FormGroup } from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  forkJoin,
  map,
  Observable,
  startWith,
  Subject,
  switchMap,
  take,
  takeUntil,
  of,
} from 'rxjs';
import { DEBOUNCE_TIME } from '../shared/constants';
import { StoreLookupDto, StoreService } from '@proxy/stores';
import { permissions } from '../shared/common-utils';
import { PayrollReportService } from '../services/reports/payroll-report.service';

@Component({
  selector: 'app-payroll',
  templateUrl: './payroll.component.html',
  styleUrl: './payroll.component.scss',
  providers: [ListService],
})
export class PayrollComponent implements OnInit, OnDestroy {
  employeeSetting: EmployeeSettingDto;
  todayDate: string = new Date().toDateString();
  payrollFrequencies: { text: string; value: number }[];
  payrollFrequencyName: string;
  newFirstPayrollOfYear: string;
  payPeriodSlots: { text: string; value: number; startDate: Date; endDate: Date }[] = [];
  checkInOuts = { items: [], totalCount: 0 } as PagedResultDto<CheckInOutDto>;
  regularHours: number = 0;
  regularMins: number = 0;
  overtimeHours: number = 0;
  overtimeMins: number = 0;
  currentSlot = 0;
  columns = [
    'currentTime',
    'employeeId',
    'departmentId',
    'shopId',
    'checkinTime',
    'checkoutTime',
    'comment',
    'actions',
  ];
  isModalOpen = false;
  exportUrl = EXPORT_CONFIG.payrollsUrl;
  exportFieldList = [
    'employeeId',
    'displayName',
    'departmentName',
    'storeCode',
    'storeName',
    'currentTime',
    'checkoutTime',
    'comment',
  ];
  employees$: Observable<EmployeeDto[]>;
  selectedEmployeeId: string = null;
  form: FormGroup;
  storeList: StoreLookupDto[];
  employeeId: string;
  destroy$ = new Subject<void>();
  readonly payrollPermissionNames = [
    permissions.TimeCardSelfReport,
    permissions.TimeCardSelfReportEdit,
    permissions.TimeCardOtherReport,
    permissions.TimeCardOtherReportEdit,
  ];

  permissions: Record<string, boolean> = {
    timeCardSelfReport: false,
    timeCardSelfReportEdit: false,
    timeCardOtherReport: false,
    timeCardOtherReportEdit: false,
  };

  hasEditPermission: boolean = false;

  constructor(
    private readonly employeeSettingService: EmployeeSettingService,
    private readonly toaster: ToasterService,
    private readonly localizationService: LocalizationService,
    private readonly payrollService: PayrollService,
    public readonly list: ListService<CheckInOutDto>,
    private dialog: MatDialog,
    private employeeService: EmployeeService,
    private readonly fb: FormBuilder,
    private storeService: StoreService,
    private permissionService: PermissionService,
    private confirmation: ConfirmationService,
    private payrollReportService: PayrollReportService,
  ) {}

  ngOnInit(): void {
    this.getPermissions();
    this.buildForm();
    this.payrollFrequencies = Object.keys(PayrollFrequency)
      .filter(key => isNaN(Number(key)))
      .map(key => ({
        text: this.localizationService.instant(`::Enum:PayrollFrequency.${key}`),
        value: PayrollFrequency[key] as number,
      }));

    this.getEmployeeSettings();

    this.employees$ = this.form.controls['employeeId'].valueChanges.pipe(
      startWith(''),
      debounceTime(DEBOUNCE_TIME),
      distinctUntilChanged(),
      switchMap(value => this.fetchAndValidateOptions(value)), // Combined fetch and validate
    );
    this.getStores();
  }

  private getEmployeeSettings() {
    this.employeeSettingService.getEmployeeSetting().subscribe(response => {
      if (response) {
        this.employeeSetting = response;
        this.getPayperiodSlots(
          new Date(Date.parse(response.firstPayrollOfYear)),
          response.payrollFrequency,
        );
        this.payrollFrequencyName = this.localizationService.instant(
          `::Enum:PayrollFrequency.${PayrollFrequency[response.payrollFrequency]}`,
        );
        this.newFirstPayrollOfYear = new Date(
          this.payPeriodSlots[this.payPeriodSlots.length - 1].startDate,
        ).toDateString();
        this.form.patchValue({ payPeriodSlot: this.payPeriodSlots.length });
        this.currentSlot = this.payPeriodSlots.length;
      }
    });
  }

  private getPayperiodSlots(date: Date, frequency: number) {
    let days = frequency === 0 ? 7 : 14;
    let months = frequency === 2 ? 1 : 2;
    let idx = 1;
    let currentDate = new Date();
    let newDate = new Date(date.toLocaleDateString());
    while (newDate <= currentDate) {
      let prevDate = new Date(newDate);
      if (frequency <= 1) {
        newDate.setDate(newDate.getDate() + days - 1);
        if (newDate >= currentDate)
          this.payPeriodSlots.push({
            text: currentDate.toDateString(),
            value: idx,
            startDate: prevDate,
            endDate: currentDate,
          });
        else
          this.payPeriodSlots.push({
            text: newDate.toDateString(),
            value: idx,
            startDate: prevDate,
            endDate: new Date(newDate),
          });
      } else if (frequency <= 3) {
        newDate.setMonth(newDate.getMonth() + months);
        if (newDate >= currentDate)
          this.payPeriodSlots.push({
            text: currentDate.toDateString(),
            value: idx,
            startDate: prevDate,
            endDate: currentDate,
          });
        else
          this.payPeriodSlots.push({
            text: newDate.toDateString(),
            value: idx,
            startDate: prevDate,
            endDate: new Date(newDate),
          });
      }
      idx++;
      newDate.setDate(newDate.getDate() + 1);
    }
  }

  onChangePayPeriodSlot(event: any) {
    if (event) {
      if (!event.value) {
        return;
      }
      this.currentSlot = event.value;
      let paySlot = this.payPeriodSlots.filter(c => c.value === event.value);
      if (paySlot.length > 0) {
        this.newFirstPayrollOfYear = paySlot[0].startDate.toDateString();
        this.todayDate = paySlot[0].endDate.toDateString();

        this.payrollService
          .getList({
            startDate: this.newFirstPayrollOfYear,
            endDate: this.todayDate,
            employeeId: this.selectedEmployeeId,
          } as GetCheckInOutListDto)
          .subscribe(response => {
            this.convertCheckInOutsToLocalTime(response);
            this.calculatePayrollTimes();
          });
      }
      this.form.patchValue({ fromDate: '', toDate: '' });
    }
  }

  calculatePayrollTimes() {
    this.regularHours = 0;
    this.regularMins = 0;
    this.overtimeHours = 0;
    this.overtimeMins = 0;
    this.checkInOuts.items.forEach(c => {
      const diffInMs = Math.abs(
        new Date(c.checkoutTime).getTime() - new Date(c.currentTime).getTime(),
      );
      let diffHours = Math.floor(diffInMs / (1000 * 60 * 60));
      let diffMinutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
      if (diffHours >= this.employeeSetting.dailyOvertimeThreshold) {
        this.regularHours += this.employeeSetting.dailyOvertimeThreshold;
        this.overtimeHours += diffHours - this.employeeSetting.dailyOvertimeThreshold;
        this.overtimeMins += diffMinutes;
      } else {
        this.regularHours += diffHours;
        this.regularMins += diffMinutes;
      }
    });
  }

  changeSort(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
    this.loadPayrolls();
  }

  changePage(event: PageEvent) {
    this.list.page = event.pageIndex;
    this.loadPayrolls();
  }

  createPayroll() {
    const dialogRef = this.dialog.open(PayrollDialogComponent, {
      width: '50%',
      data: { isEditMode: false },
      enterAnimationDuration: 250,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        result.currentTime = this.getCombinedDateTime(result.checkInDate, result.checkInTime);
        result.checkoutTime = this.getCombinedDateTime(result.checkOutDate, result.checkOutTime);
        result.isCheckIn = true;
        result.isCheckOut = Boolean(result.checkoutTime);
        result.isClosed = !!(result.currentTime && result.checkoutTime);
        this.payrollService.create(result).subscribe({
          next: () => {
            this.loadPayrolls();
            this.toaster.success('::Payroll:SuccessfullyAdded');
          },
          error: () => {
            this.toaster.error('Payroll:ErrorOccured');
          },
        });
      }
    });
  }

  editPayroll(id: string) {
    this.payrollService.get(id).subscribe(response => {
      const res = {
        ...response,
        currentTime: this.convertUTCtoLocal(response.currentTime),
        checkoutTime: this.convertUTCtoLocal(response.checkoutTime),
      };
      const dialogRef = this.dialog.open(PayrollDialogComponent, {
        width: '50%',
        data: { ...res, isEditMode: true },
        enterAnimationDuration: 250,
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          result.currentTime = this.getCombinedDateTime(result.checkInDate, result.checkInTime);
          result.checkoutTime = this.getCombinedDateTime(result.checkOutDate, result.checkOutTime);
          result.isCheckIn = true;
          result.isCheckOut = Boolean(result.checkoutTime);
          result.isClosed = !!(result.currentTime && result.checkoutTime);
          this.payrollService.update(id, result).subscribe({
            next: () => {
              this.loadPayrolls();
              this.toaster.success('::Payroll:SuccessfullyUpdated');
            },
            error: () => {
              this.toaster.error('::Payroll:ErrorOccured');
            },
          });
        }
      });
    });
  }

  getCombinedDateTime(date: any, time: any): Date | null {
    if (date && time) {
      const [hours, minutes] = time.split(':').map((value: string) => parseInt(value, 10));

      const checkOutDateTime = new Date(date);
      checkOutDateTime.setHours(hours);
      checkOutDateTime.setMinutes(minutes);
      return checkOutDateTime;
    }
    return null;
  }

  handleImportClick() {
    const dialogRef = this.dialog.open(ImportComponent, {
      width: '50%',
      enterAnimationDuration: 250,
    });

    dialogRef.afterClosed().subscribe(result => {
      const checkInOuts = result as CheckInOutDto[];
      if (checkInOuts && this.isValidCheckInOutArray(checkInOuts)) {
        this.payrollService.import(checkInOuts).subscribe({
          next: () => {
            this.loadPayrolls();
            this.toaster.success('::Payroll:SuccessfullyImported');
          },
          error: () => {
            this.toaster.error('::Payroll:ErrorOccured');
          },
        });
      } else {
        this.toaster.error('::Payroll:InvalidDataFormat');
      }
    });
  }

  convertCheckInOutsToLocalTime(checkInOuts: PagedResultDto<CheckInOutDto>) {
    this.checkInOuts = checkInOuts;
    this.checkInOuts.items = checkInOuts.items.map(item => {
      return {
        ...item,
        currentTime: this.convertUTCtoLocal(item.currentTime),
        checkoutTime: this.convertUTCtoLocal(item.checkoutTime),
      };
    });
  }

  convertUTCtoLocal(date: string) {
    const localDate = new Date(date);
    const formattedDate =
      localDate.getFullYear() +
      '-' +
      String(localDate.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(localDate.getDate()).padStart(2, '0') +
      'T' +
      String(localDate.getHours()).padStart(2, '0') +
      ':' +
      String(localDate.getMinutes()).padStart(2, '0') +
      ':' +
      String(localDate.getSeconds()).padStart(2, '0');
    return formattedDate;
  }

  onChangeEmployees(event: any) {
    if (event) {
      this.selectedEmployeeId = event.option.value?.employeeId;
      this.getPayrollList();
    }
  }

  getPayrollList() {
    this.payrollService
      .getList({
        startDate: this.newFirstPayrollOfYear,
        endDate: this.todayDate,
        employeeId: this.selectedEmployeeId,
      } as GetCheckInOutListDto)
      .subscribe(response => {
        this.checkInOuts = response;
        this.calculatePayrollTimes();
      });
  }

  displayEmployeeName(employee: EmployeeDto): string {
    return employee ? employee.displayName : '';
  }

  private buildForm() {
    this.form = this.fb.group({
      fromDate: [''],
      toDate: [''],
      employeeId: [''],
      payPeriodSlot: [null],
      stores: [[]],
    });
  }

  fetchAndValidateOptions(value: string): Observable<EmployeeDto[]> {
    return this.employeeService
      .getList({ filter: value, maxResultCount: 20 } as FilterPagedAndSortedResultRequestDto)
      .pipe(
        map(res => {
          return res.items;
        }),
      );
  }

  onDateRangeFiltering(): void {
    if (this.form.valid) {
      const formValue = this.form.value;
      const fromDateValue = formValue.fromDate;
      const toDateValue = formValue.toDate;
      this.newFirstPayrollOfYear = fromDateValue && fromDateValue.toDateString();
      this.todayDate = toDateValue && toDateValue.toDateString();

      this.payrollService
        .getList({
          startDate: this.newFirstPayrollOfYear,
          endDate: this.todayDate,
          employeeId: this.selectedEmployeeId,
          stores: formValue.stores,
        } as GetCheckInOutListDto)
        .subscribe(response => {
          this.checkInOuts = response;
          this.calculatePayrollTimes();
        });
    } else {
      this.form.markAllAsTouched();
      this.toaster.error('::ValidationError:InvalidFormOrData');
    }
  }

  clearFiltering(): void {
    this.form.reset();
  }

  private loadPayrolls() {
    const valueStreamCreator = query =>
      this.payrollService.getList({
        ...query,
        employeeId: this.selectedEmployeeId,
        startDate: this.newFirstPayrollOfYear,
        endDate: this.todayDate,
      });

    this.list
      .hookToQuery(valueStreamCreator)
      .pipe(take(1))
      .subscribe(response => {
        this.convertCheckInOutsToLocalTime(response);
        this.calculatePayrollTimes();
      });
  }

  private isValidCheckInOutArray(data: any[]): data is CheckInOutDto[] {
    return data.every(item => this.isValidCheckInOutDto(item));
  }

  private isValidCheckInOutDto(item: any): item is CheckInOutDto {
    return (
      typeof item === 'object' &&
      'currentTime' in item &&
      item.checkInTime !== '' &&
      'checkoutTime' in item &&
      item.checkOutTime !== '' &&
      'employeeId' in item &&
      item.employeeId !== '' &&
      'storeCode' in item &&
      item.storeCode !== '' &&
      'departmentName' in item &&
      item.departmentName !== ''
    );
  }

  payrollData(): void {
    const valueStreamCreator = query =>
      this.payrollService.getList({
        ...query,
        employeeId: this.selectedEmployeeId,
        startDate: this.newFirstPayrollOfYear,
        endDate: this.todayDate,
      });

    this.list.hookToQuery(valueStreamCreator).subscribe(response => {
      this.convertCheckInOutsToLocalTime(response);
      this.calculatePayrollTimes();
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

  private getCurrentEmployeePayrollDetails() {
    this.employeeService
      .getCurrentEmployee()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: employee => {
          this.selectedEmployeeId = employee.employeeId;
          this.getPayrollList();
        },
      });
  }

  private getPermissions() {
    this.checkMultiplePermissions(this.payrollPermissionNames)
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.permissions.timeCardSelfReport = result[permissions.TimeCardSelfReport];
        this.permissions.timeCardSelfReportEdit = result[permissions.TimeCardSelfReportEdit];
        this.permissions.timeCardOtherReport = result[permissions.TimeCardOtherReport];
        this.permissions.timeCardOtherReportEdit = result[permissions.TimeCardOtherReportEdit];

        if (!this.permissions.timeCardSelfReport && !this.permissions.timeCardOtherReport) return;

        if (this.permissions.timeCardSelfReport && !this.permissions.timeCardOtherReport) {
          this.getCurrentEmployeePayrollDetails();
        } else {
          this.loadPayrolls();
        }

        this.hasEditPermission =
          this.permissions.timeCardSelfReportEdit || this.permissions.timeCardOtherReportEdit;
      });
  }

  checkMultiplePermissions(permissionNames: string[]): Observable<Record<string, boolean>> {
    const response: { [key: string]: Observable<boolean> } = {};

    for (const name of permissionNames) {
      const granted = this.permissionService.getGrantedPolicy(name);
      response[name] = of(granted);
    }

    return forkJoin(response);
  }

  printData() {
    this.confirmation
      .warn('::Payroll:ThisWillPrint', '::Payroll:AreYouSureToProceed')
      .subscribe(status => {
        if (status === Confirmation.Status.confirm) {
          if (this.form.valid) {
            const paySlot = this.payPeriodSlots.filter(c => c.value === this.currentSlot);

            const formValue = this.form.value;
            const employeeId = this.selectedEmployeeId;
            const storeNames = this.storeList
              .filter(s => formValue.stores.includes(s.id))
              .map(s => s.storeName);
            const stores = formValue.stores;
            const startDate = formValue.fromDate
              ? formValue.fromDate.toDateString()
              : paySlot[0].startDate.toDateString();
            const endDate = formValue.toDate
              ? formValue.toDate.toDateString()
              : paySlot[0].endDate.toDateString();

            this.payrollReportService.printPdf(startDate, endDate, stores, storeNames, employeeId);
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
