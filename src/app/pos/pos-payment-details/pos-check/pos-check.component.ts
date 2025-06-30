import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SharedDataService } from '../../shared-data.service';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { PaymentMethod } from '@proxy/payment';
import { ToasterService } from '@abp/ng.theme.shared';
import { ApplyPaymentDto } from '@proxy/orders/models';
import { OrderService } from '@proxy/orders';

@Component({
  selector: 'app-pos-check',
  templateUrl: './pos-check.component.html',
  styleUrl: './pos-check.component.scss',
})
export class PosCheckComponent implements OnInit {
  checkForm: FormGroup;
  totalPayableAmount: number;
  orderId: string;
  customerId: string;
  remainingAmount: number;
  @Output() accept = new EventEmitter<any>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly sharedDataService: SharedDataService,
    private readonly decimalPipe: DecimalPipe,
    private readonly toasterService: ToasterService,
    private readonly orderService: OrderService,
  ) {}

  ngOnInit(): void {
    this.checkForm = this.fb.group({
      checkNumber: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(20)]],
      enteredAmount: [0.0, [Validators.required, this.enteredAmountValidator()]],
    });

    this.sharedDataService.orderSummary.subscribe(result => {
      this.orderId = result.orderId;
      this.customerId = result.customer?.id;
      this.totalPayableAmount = result.amountPayable;
      this.remainingAmount = Number(result.amountDue);
      this.checkForm
        .get('enteredAmount')
        .setValue(Number(this.decimalPipe.transform(this.remainingAmount)).toFixed(2));
    });
  }

  onAccept() {
    if (!this.checkForm.valid) {
      this.checkForm.markAllAsTouched();
      this.toasterService.error('::ValidationError:InvalidFormOrData');
      return;
    }

    const enteredAmount = Number(Number(this.checkForm.get('enteredAmount').value)?.toFixed(2));
    const checkNumber = this.checkForm.get('checkNumber').value;

    let applyPaymentDto: ApplyPaymentDto = {
      paymentMethod: PaymentMethod.Check,
      paidAmount: enteredAmount,
      checkNumber: checkNumber,
      orderId: this.orderId,
      customerId: this.customerId,
      paymentMethodAdditionalFee: 0,
    };

    this.orderService.applyPaymentToOrder(this.orderId, applyPaymentDto).subscribe({
      next: () => {
        this.sharedDataService.calculatePaidAmount(enteredAmount);
        this.sharedDataService.broadcastOrderSummary();
        this.accept.emit({ enteredAmount: enteredAmount, checkNumber: checkNumber });
      },
      error: () => {
        this.toasterService.error('Check payment failed');
      },
    });
  }

  private enteredAmountValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      if (control.value <= 0.0) {
        return { nonPositive: true };
      }
      const isValid = control.value <= Number(this.decimalPipe.transform(this.remainingAmount));
      return isValid ? null : { invalidAmount: true };
    };
  }
}
