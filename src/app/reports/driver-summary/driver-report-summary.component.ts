import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { InputFilterDto } from '@proxy/reports';
import { Subject } from 'rxjs';
import { ReportFilterConfigDto } from 'src/app/models/report-filter-config-dto';
import { ReportFilterDto } from 'src/app/models/report-filter-dto';
import { DriverProductivitySummaryReportService } from 'src/app/services/reports/driver-productivity-summary-report.service';

@Component({
  selector: 'app-driver-summary',
  templateUrl: './driver-report-summary.component.html',
  styleUrl: './driver-report-summary.component.scss',
})
export class DriverReportSummaryComponent implements OnInit, OnDestroy {
  filterForm: FormGroup;
  fromDate: string;
  toDate: string;
  destroy$ = new Subject<void>();
  reportFilterConfig: ReportFilterConfigDto;

  constructor(private driverSummaryReportService: DriverProductivitySummaryReportService) {}

  ngOnInit(): void {
    this.reportFilterConfig = {
      hasSingleDate: true,
    } as ReportFilterConfigDto;
  }

  onReportGenerate(filters: ReportFilterDto) {
    const input = {
      fromDate: filters.fromDate,
      toDate: filters.toDate,
    } as InputFilterDto;

    this.driverSummaryReportService.generateReport(input);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
