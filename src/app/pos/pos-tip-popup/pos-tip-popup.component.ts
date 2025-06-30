import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ValueDto, ValuePagedAndSortedResultRequestDto, ValueService } from '@proxy/values';
import { ValueTypeSettingService } from '@proxy/value-type-settings';
import { ToasterService } from '@abp/ng.theme.shared';

@Component({
  selector: 'app-pos-tip-popup',
  templateUrl: './pos-tip-popup.component.html',
  styleUrl: './pos-tip-popup.component.scss',
})
export class PosTipPopupComponent implements OnInit {
  public tipForm: FormGroup;
  public tipValueTypes: ValueDto[] = [];

  constructor(
    private valueService: ValueService,
    private valueTypeSettingService: ValueTypeSettingService,
    public fb: FormBuilder,
    public dialogRef: MatDialogRef<PosTipPopupComponent>,
    private toaster: ToasterService,
  ) {}

  ngOnInit(): void {
    this.tipForm = this.fb.group({
      tipValueTypeId: [null, Validators.required],
      tipAmount: [0, [Validators.required, this.nonPositiveAmountValidator()]],
    });

    this.valueTypeSettingService.getOrderValueTypeSetting().subscribe({
      next: response => {
        const tipValueTypeId = response.tip;
        this.valueService
          .getList({
            valueTypeId: tipValueTypeId,
          } as ValuePagedAndSortedResultRequestDto)
          .subscribe({
            next: response => {
              this.tipValueTypes = response.items;
              const preselectedTip = this.tipValueTypes.find(e => e.isPreSelect);
              if (preselectedTip) {
                this.tipForm.patchValue({ tipValueTypeId: preselectedTip.id });
              }
            },
            error: err => {
              throw new Error(err.message);
            },
          });
      },
      error: err => {
        throw new Error(err.message);
      },
    });
  }

  applyTip() {
    if (this.tipForm.invalid) {
      this.tipForm.markAllAsTouched();
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }

    this.dialogRef.close(this.tipForm.value);
  }

  onClose() {
    this.dialogRef.close();
  }

  private nonPositiveAmountValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      return control.value <= 0 ? { nonPositive: true } : null;
    };
  }
}
