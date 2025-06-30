import { ToasterService } from '@abp/ng.theme.shared';
import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { EmployeeService } from '@proxy/employees';
import { CreateUpdateOpeningBalanceDto, OpeningBalanceService } from '@proxy/opening-balances';
import { DIALOG_ENTER_ANIMATION_DURATION } from 'src/app/shared/dialog.constants';
import { SharedModule } from 'src/app/shared/shared.module';
import { PosOpeningBalanceCashBalancingComponent } from './pos-opening-balance-cash-balancing/pos-opening-balance-cash-balancing.component';

@Component({
  selector: 'app-pos-opening-balance',
  standalone: true,
  imports: [SharedModule, CommonModule],
  templateUrl: './pos-opening-balance.component.html',
  styleUrl: './pos-opening-balance.component.scss',
})
export class PosOpeningBalanceComponent implements OnInit {
  pin: string;
  employeeId: string;
  isValidEmployee: boolean = false;
  balance: number = 0;
  isNewOpeningBalance: boolean = false;
  hidePassword: boolean = true;
  openingBalanceDto: CreateUpdateOpeningBalanceDto = {
    balance: 0,
  };
  isGenericUser: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<PosOpeningBalanceComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { employeeId: string },
    private employeeService: EmployeeService,
    private openingBalanceService: OpeningBalanceService,
    private toasterService: ToasterService,
    private dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.employeeId = this.data.employeeId;
    if (!this.employeeId) {
      this.employeeService.getCurrentEmployee().subscribe({
        next: employee => {
          this.employeeId = employee.employeeId;
        },
      });
    }
  }

  onClose = (): void => this.dialogRef.close();

  submitOpeningBalance(): void {
    if (!Number.isFinite(this.balance)) {
      this.toasterService.error('::Pos:OpeningBalanceRequired');
      return;
    }
    if (this.isValidEmployee) {
      this.openingBalanceDto.balance = this.balance;
      if (this.isNewOpeningBalance) this.createOpeningBalance();
      else this.updateOpeningBalance();
    }
  }

  checkOpeningBalance(): void {
    if (!this.pin?.trim()) {
      this.toasterService.error('::Pos:OpeningBalancePinRequired');
      return;
    }

    this.employeeService
      .userEligibilityForOpeningBalance(this.employeeId, this.pin)
      .subscribe(condition => {
        this.isValidEmployee = condition;
        if (condition) {
          this.openingBalanceService.getTodayOpeningBalance().subscribe(openingBalance => {
            if (!openingBalance) this.isNewOpeningBalance = true;
            else {
              this.isNewOpeningBalance = false;
              this.balance = openingBalance.balance;
            }
          });
        } else this.toasterService.error('::EmployeeNotFoundError');
      });
  }

  createOpeningBalance(): void {
    this.openingBalanceDto.employeeId = this.employeeId;
    this.openingBalanceService.create(this.openingBalanceDto).subscribe({
      next: () => {
        this.toasterService.success('::Pos:OpeningBalanceCreate');
        this.isNewOpeningBalance = false;
      },
      error: () => {
        this.toasterService.error('::Pos:OpeningBalanceError');
      },
    });
  }

  updateOpeningBalance(): void {
    this.openingBalanceDto.employeeId = this.employeeId;
    this.openingBalanceService.update(this.openingBalanceDto).subscribe({
      next: () => {
        this.toasterService.success('::Pos:OpeningBalanceUpdate');
      },
      error: () => {
        this.toasterService.error('::Pos:OpeningBalanceError');
      },
    });
  }

  togglePasswordVisibility(event: MouseEvent) {
    event.preventDefault();
    this.hidePassword = !this.hidePassword;
    event.stopPropagation();
  }

  openCashDrawerDialogue() {
    this.dialog.open(PosOpeningBalanceCashBalancingComponent, {
      width: '80%',
      height: '100%',
      enterAnimationDuration: DIALOG_ENTER_ANIMATION_DURATION,
    });
    this.dialogRef.close();
  }
}
