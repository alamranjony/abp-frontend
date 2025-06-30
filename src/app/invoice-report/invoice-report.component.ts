import { ToasterService } from '@abp/ng.theme.shared';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActionType, StepType } from './invoice-report-type.enum';
import { InvoiceRegisterService } from '../services/reports/invoice-register-report.service';
import { DailyInvoiceReportService } from '../services/reports/daily-invoice-report.service';
import { PhoneOutReportService } from '../services/reports/phone-out-report.service';
import { UnpostedInvoiceReportService } from '../services/reports/unposted-invoice-report.service';

@Component({
  selector: 'app-invoice-report',
  templateUrl: './invoice-report.component.html',
  styleUrl: './invoice-report.component.scss',
})
export class InvoiceReportComponent implements OnInit {
  filterForm: FormGroup;
  fromDate: string;
  toDate: string;
  step = StepType;
  actionType = ActionType;

  constructor(
    private fb: FormBuilder,
    private readonly toasterService: ToasterService,
    private readonly invoiceRegisterService: InvoiceRegisterService,
    private readonly dailyInvoiceReportService: DailyInvoiceReportService,
    private readonly phoneOutReportService: PhoneOutReportService,
    private readonly unpostedInvoiceReportService: UnpostedInvoiceReportService,
  ) {}

  ngOnInit(): void {
    this.buildForm();
  }

  private buildForm(): void {
    this.filterForm = this.fb.group({
      fromDate: [],
      toDate: [],
    });
  }

  handleAction(step: StepType, action: ActionType): void {
    if (this.validateDates()) {
      switch (step) {
        case StepType.Step1:
          this.dailyInvoiceReportService.generateReport(
            this.fromDate,
            this.toDate,
            action === ActionType.Print,
          );
          break;
        case StepType.Step2:
          this.invoiceRegisterService.generateReport(
            this.fromDate,
            this.toDate,
            action === ActionType.Print,
          );
          break;
        case StepType.Step4:
          this.phoneOutReportService.generateReport(
            this.fromDate,
            this.toDate,
            action === ActionType.Print,
          );
          break;
        case StepType.Step5:
          this.unpostedInvoiceReportService.generateReport(
            this.fromDate,
            this.toDate,
            action === ActionType.Print,
          );
          break;
        default:
      }
    }
  }

  private validateDates(): boolean {
    if (!this.filterForm.value.fromDate || !this.filterForm.value.toDate) {
      this.toasterService.error('::Invoicing:DateRequired');
      return false;
    }

    const fromDateValue = new Date(this.filterForm.value.fromDate);
    const toDateValue = new Date(this.filterForm.value.toDate);

    if (fromDateValue && toDateValue && fromDateValue > toDateValue) {
      this.toasterService.error('::OrderControl:DateValidation');
      return false;
    }

    this.fromDate = fromDateValue.toDateString();
    this.toDate = toDateValue.toDateString();

    return true;
  }
}
