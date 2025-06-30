import { Injectable } from '@angular/core';
import { EmployeeDto, EmployeeService } from '@proxy/employees';
import { ToasterService } from '@abp/ng.theme.shared';
import { MAX_RESULT_COUNT } from '../shared/constants';
import { Observable } from 'rxjs';
import { PagedResultDto } from '@abp/ng.core';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root',
})
export class EmployeeCsvExportService {
  private headers: string[] = [
    'Last Name',
    'First Name',
    'Display Name',
    'ID',
    'Role',
    'Status',
    'Location',
    'Dept',
    'Address1',
    'Address2',
    'State',
    'Country',
    'Email',
    'Phone Number',
    'Emergency Contact Name',
    'Phone',
  ];

  constructor(
    private employeeService: EmployeeService,
    private toasterService: ToasterService,
  ) {}

  exportEmployeesXlsx(): void {
    const employees: EmployeeDto[] = [];
    let skipCount = 0;
    const maxResultCount = MAX_RESULT_COUNT;

    const fetchBatch = () => {
      this.fetchEmployees(skipCount, maxResultCount).subscribe(response => {
        employees.push(...response.items);
        if (response.totalCount > skipCount + maxResultCount) {
          skipCount += maxResultCount;
          fetchBatch();
        } else {
          if (employees.length === 0) {
            this.toasterService.warn('::EmployeeExportError');
            return;
          }
          this.exportToXlsx(employees);
        }
      });
    };

    fetchBatch();
  }

  fetchEmployees(
    skipCount: number,
    maxResultCount: number,
  ): Observable<PagedResultDto<EmployeeDto>> {
    return this.employeeService.getList({
      skipCount: skipCount,
      maxResultCount: maxResultCount,
    });
  }

  async exportToXlsx(employees: EmployeeDto[]): Promise<void> {
    const rows = employees.map(employee => [
      employee.lastName,
      employee.firstName,
      employee.displayName,
      employee.employeeId,
      employee.role,
      employee.status,
      employee.storeName,
      employee.department,
      employee.address1,
      employee.address2 || '',
      employee.stateProvince,
      employee.country,
      employee.email,
      employee.phoneNumber,
      employee.contactPersonName,
      employee.contactPersonPhone,
    ]);

    const timestamp = new Date()
      .toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })
      .replace(/[/, ]/g, '_')
      .replace(/:/g, '_');

    const filename = `Employees_${timestamp}.xlsx`;
    const worksheet = XLSX.utils.aoa_to_sheet([this.headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');
    XLSX.writeFile(workbook, filename);
  }
}
