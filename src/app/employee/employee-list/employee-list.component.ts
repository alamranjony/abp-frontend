import { Component, OnInit } from '@angular/core';
import { ListService, PagedResultDto } from '@abp/ng.core';
import { EmployeeDto, EmployeeService } from '@proxy/employees';
import { FilterPagedAndSortedResultRequestDto } from '@proxy/shared';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { Confirmation, ConfirmationService, ToasterService } from '@abp/ng.theme.shared';
import { EXPORT_CONFIG } from '../../export/export-config';
import { EmployeeCsvExportService } from '../../services/employee-csv-export.service';
import { take } from 'rxjs';

@Component({
  selector: 'app-employee-list',
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.scss',
  providers: [ListService],
})
export class EmployeeListComponent implements OnInit {
  employees = { items: [], totalCount: 0 } as PagedResultDto<EmployeeDto>;
  filter: string = '';
  columns: string[] = [
    'displayName',
    'employeeId',
    'role',
    'status',
    'location',
    'department',
    'actions',
  ];
  exportFieldList = [
    'firstName',
    'middleName',
    'lastName',
    'displayName',
    'address1',
    'address2',
    'city',
    'zipcode',
    'stateProvince',
    'country',
    'hireDate',
    'terminationDate',
    'role',
    'department',
    'status',
    'storeName',
    'payoutAmount',
    'isEmployeeOrderReview',
    'userName',
    'email',
    'employeeId',
    'contactPersonName',
    'contactPersonPhone',
    'contactPersonRelation',
    'comment',
    'phoneNumber',
    'phoneNumberTypeName',
  ];
  exportUrl = EXPORT_CONFIG.employeeUrl;

  constructor(
    public readonly list: ListService<FilterPagedAndSortedResultRequestDto>,
    private employeeService: EmployeeService,
    private confirmation: ConfirmationService,
    private toaster: ToasterService,
    private exportEmployeeService: EmployeeCsvExportService,
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  onSearch(filter: string): void {
    this.filter = filter;
    this.list.page = 0;
    this.loadEmployees();
  }

  changePage(pageEvent: PageEvent) {
    this.list.page = pageEvent.pageIndex;
    this.loadEmployees();
  }

  changeSort(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
    this.loadEmployees();
  }

  edit(id: string): void {}

  delete(id: string): void {
    this.confirmation.warn('::AreYouSureToDelete', '::AreYouSure').subscribe(status => {
      if (status === Confirmation.Status.confirm) {
        const request = this.employeeService.delete(id);
        request.subscribe({
          next: () => {
            this.loadEmployees();
            this.toaster.success('::EmployeeDeletedSuccessfully');
          },
          error: err => {
            this.toaster.error('::EmployeeDeleteError');
          },
        });
      }
    });
  }

  exportEmployee(): void {
    this.exportEmployeeService.exportEmployeesXlsx();
  }

  private loadEmployees() {
    this.list
      .hookToQuery(query =>
        this.employeeService.getList({
          ...query,
          filter: this.filter,
        }),
      )
      .pipe(take(1))
      .subscribe(response => {
        this.employees = response;
      });
  }
}
