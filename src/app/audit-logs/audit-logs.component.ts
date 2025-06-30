import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Observable, take } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatSort, Sort } from '@angular/material/sort';
import { DatePipe } from '@angular/common';
import { ListService, PagedResultDto } from '@abp/ng.core';
import { AuditLogDto, AuditLogService, AuditTypeLookupDto, AuditTypeService } from '@proxy/logs';
import { EXPORT_CONFIG } from '../export/export-config';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-audit-logs',
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.scss'],
  providers: [ListService, DatePipe],
})
export class AuditLogsComponent implements OnInit {
  auditLogs: PagedResultDto<AuditLogDto> = { items: [], totalCount: 0 };
  auditTypes$: Observable<AuditTypeLookupDto[]>;
  searchForm: FormGroup;
  displayedColumns: string[] = ['auditType', 'comment', 'ipAddress', 'creationTime', 'userName'];
  exportUrl: string = EXPORT_CONFIG.auditLogUrl;
  exportFieldList: string[] = [
    'auditType',
    'entityName',
    'comment',
    'ipAddress',
    'tenantId',
    'userName',
    'storeName',
    'creationTime',
  ];

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    public readonly list: ListService,
    private auditLogService: AuditLogService,
    private fb: FormBuilder,
    private datePipe: DatePipe,
    auditTypeService: AuditTypeService,
  ) {
    this.auditTypes$ = auditTypeService.getAuditTypeLookup().pipe(map(e => e.items));
  }

  ngOnInit(): void {
    this.searchForm = this.fb.group({
      systemKeyWord: [null],
      startDate: [null],
      endDate: [null],
    });

    this.searchForm.valueChanges.subscribe(() => {
      this.list.page = 0;
      this.loadAuditLogs();
    });

    this.loadAuditLogs();
  }

  clearStartDate() {
    this.searchForm.get('startDate').setValue(null);
  }

  clearEndDate() {
    this.searchForm.get('endDate').setValue(null);
  }

  changePage(event: PageEvent) {
    this.list.page = event.pageIndex;
    this.loadAuditLogs();
  }

  changeSort(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
    this.loadAuditLogs();
  }

  private loadAuditLogs() {
    const formValue = this.searchForm.value;
    const startDate = formValue.startDate
      ? this.datePipe.transform(formValue.startDate, 'yyyy-MM-dd')
      : null;
    const endDate = formValue.endDate
      ? this.datePipe.transform(formValue.endDate, 'yyyy-MM-dd')
      : null;

    this.list
      .hookToQuery(query =>
        this.auditLogService.getList({
          ...query,
          systemKeyWord: formValue.systemKeyWord,
          startDate: startDate,
          endDate: endDate,
        }),
      )
      .pipe(take(1))
      .subscribe(response => {
        this.auditLogs = response;
      });
  }
}
