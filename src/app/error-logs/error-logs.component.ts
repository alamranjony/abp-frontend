import { ListService, PagedResultDto } from '@abp/ng.core';
import { DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSort, Sort } from '@angular/material/sort';
import { ErrorLogDto, ErrorLogService } from '@proxy/logs';
import { EXPORT_CONFIG } from '../export/export-config';
import { MatDialog } from '@angular/material/dialog';
import { ErrorLogDetailsDialogComponent } from './error-log-details-dialog/error-log-details-dialog.component';
import { PageEvent } from '@angular/material/paginator';
import { take } from 'rxjs';

enum LogLevel {
  Debug = 1,
  Information,
  Warning,
  Error,
  Fatal,
}

@Component({
  selector: 'app-error-logs',
  templateUrl: './error-logs.component.html',
  styleUrl: './error-logs.component.scss',
  providers: [ListService, DatePipe],
})
export class ErrorLogsComponent implements OnInit {
  exportFileName: string = `Error_Log_${Date.now()}`;
  maxMsgLength: number = 200;
  errorLogs: PagedResultDto<ErrorLogDto> = { items: [], totalCount: 0 };
  searchForm: FormGroup;
  logLevels: any[];
  displayedColumns: string[] = [
    'level',
    'shortMessage',
    'fullMessage',
    'ipAddress',
    'userName',
    'timeStamp',
  ];
  exportUrl: string = EXPORT_CONFIG.errorLogUrl;
  exportFieldList: string[] = [
    'level',
    'shortMessage',
    'fullMessage',
    'ipAddress',
    'pageUrl',
    'referredUrl',
    'username',
    'storeName',
    'tenantName',
    'timeStamp',
  ];

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    public readonly list: ListService,
    private errorLogService: ErrorLogService,
    private fb: FormBuilder,
    private datePipe: DatePipe,
    public dialog: MatDialog,
  ) {
    this.logLevels = Object.keys(LogLevel)
      .filter(key => isNaN(Number(key)))
      .map(key => {
        return { text: key, value: LogLevel[key] };
      });
  }

  ngOnInit(): void {
    this.searchForm = this.fb.group({
      logLevelId: [0],
      startDate: [null],
      endDate: [null],
    });

    this.searchForm.valueChanges.subscribe(() => {
      this.list.page = 0;
      this.loadErrorLogs();
    });

    this.loadErrorLogs();
  }

  clearStartDate() {
    this.searchForm.get('startDate').setValue(null);
  }

  clearEndDate() {
    this.searchForm.get('endDate').setValue(null);
  }

  changeSort(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
    this.loadErrorLogs();
  }

  changePage(event: PageEvent) {
    this.list.page = event.pageIndex;
    this.loadErrorLogs();
  }

  private loadErrorLogs() {
    const formValue = this.searchForm.value;

    const startDate = formValue.startDate
      ? this.datePipe.transform(formValue.startDate, 'yyyy-MM-dd')
      : null;
    const endDate = formValue.endDate
      ? this.datePipe.transform(formValue.endDate, 'yyyy-MM-dd')
      : null;

    this.list
      .hookToQuery(query =>
        this.errorLogService.getList({
          ...query,
          logLevelId: formValue.logLevelId,
          startDate: startDate,
          endDate: endDate,
        }),
      )
      .pipe(take(1))
      .subscribe(response => {
        this.errorLogs = response;
      });
  }

  detailDialog(row: any) {
    const dialogRef = this.dialog.open(ErrorLogDetailsDialogComponent, {
      width: '65%',
      height: '80%',
      data: row,
    });

    dialogRef.afterClosed().subscribe();
  }
}
