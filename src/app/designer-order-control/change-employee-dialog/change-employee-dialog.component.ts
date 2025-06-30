import { ListResultDto } from '@abp/ng.core';
import { ToasterService } from '@abp/ng.theme.shared';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EmployeeLookupDto, EmployeeService } from '@proxy/employees';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-change-employee-dialog',
  templateUrl: './change-employee-dialog.component.html',
  styleUrl: './change-employee-dialog.component.scss',
})
export class ChangeEmployeeDialogComponent implements OnInit, OnDestroy {
  employees: ListResultDto<EmployeeLookupDto>;
  form: FormGroup;
  destroy$ = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<ChangeEmployeeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public employeeId: string,
    private toaster: ToasterService,
    private employeeService: EmployeeService,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.getEmployees();
  }

  buildForm() {
    this.form = this.fb.group({
      employeeId: [this.employeeId],
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

  onSave() {
    if (this.form.invalid) {
      this.toaster.error('::DesignerOrder:EmployeeRequired');
      return;
    }

    this.dialogRef.close(this.form.value);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
