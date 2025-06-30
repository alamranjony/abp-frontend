import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ErrorLogDto } from '@proxy/logs';
import { SharedModule } from 'src/app/shared/shared.module';

@Component({
  selector: 'app-error-log-details-dialog',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './error-log-details-dialog.component.html',
  styleUrl: './error-log-details-dialog.component.scss',
})
export class ErrorLogDetailsDialogComponent implements OnInit {
  errorLogDetails: { label: string; value: string }[] = [];

  constructor(
    public dialogRef: MatDialogRef<ErrorLogDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ErrorLogDto,
  ) {}

  ngOnInit(): void {
    this.errorLogDetails = [
      { label: '::Logs:Id', value: this.data.id.toString() },
      { label: '::Logs:LogLevel', value: this.data.level },
      { label: '::Logs:ShortMessage', value: this.data.shortMessage },
      { label: '::Logs:FullMessage', value: this.data.fullMessage },
      { label: '::Logs:IpAddress', value: this.data.ipAddress },
      { label: '::Logs:PageUrl', value: this.data.pageUrl },
      { label: '::Logs:ReferredUrl', value: this.data.referredUrl },
      { label: '::Logs:Username', value: this.data.username },
      { label: '::Logs:StoreName', value: this.data.storeName },
      { label: '::Logs:TenantName', value: this.data.tenantName },
      { label: '::Logs:TimeStamp', value: this.data.timeStamp },
    ];
  }
}
