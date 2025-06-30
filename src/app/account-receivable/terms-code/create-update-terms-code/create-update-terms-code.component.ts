import { LocalizationService } from '@abp/ng.core';
import { ToasterService } from '@abp/ng.theme.shared';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CreateUpdateTermsCodeDto, TermsCodeService } from '@proxy/terms-codes';
import { map, Subject, takeUntil } from 'rxjs';
import { ALLOWED_AGING_BUCKETS } from 'src/app/shared/constants';

@Component({
  selector: 'app-create-update-terms-code',
  templateUrl: './create-update-terms-code.component.html',
  styleUrls: ['./create-update-terms-code.component.scss'],
})
export class CreateUpdateTermsCodeComponent implements OnInit, OnDestroy {
  allowedAgingBuckets = ALLOWED_AGING_BUCKETS;
  termsCodeForm: FormGroup;
  destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CreateUpdateTermsCodeComponent>,
    public abpLocalization: LocalizationService,
    private termsCodeService: TermsCodeService,
    private toasterService: ToasterService,
    @Inject(MAT_DIALOG_DATA) public data: { isEditMode: boolean; termsCodeId: string },
  ) {}

  ngOnInit(): void {
    this.buildTermsCodeForm();
    if (this.data.isEditMode) {
      this.loadTermsCodeById();
    }
  }

  buildTermsCodeForm() {
    this.termsCodeForm = this.fb.group({
      code: [null, Validators.required],
      description: [null],
      netDueDays: [0, Validators.required],
      agingBucket: [null, Validators.required],
      lateChargePercentage: [null, Validators.required],
      minimumLateChargeAmount: [null, Validators.required],
      lateChargeStatementDescription: [null],
    });
  }

  loadTermsCodeById() {
    this.termsCodeService
      .get(this.data.termsCodeId)
      .pipe(
        takeUntil(this.destroy$),
        map(termsCode => {
          termsCode.agingBucket = termsCode.agingBucket * 30;
          return termsCode;
        }),
      )
      .subscribe(termsCode => {
        this.termsCodeForm.patchValue(termsCode);
      });
  }

  onChangeAgingBucket($event: any) {}

  onSave(): void {
    if (this.termsCodeForm.invalid) {
      this.termsCodeForm.markAllAsTouched();
      return;
    }

    const selectedAgingBucketInDays = this.termsCodeForm.get('agingBucket').value as number;
    const agingMonths = selectedAgingBucketInDays / 30;

    let createUpdateTermsCodeDto: CreateUpdateTermsCodeDto = {
      ...this.termsCodeForm.value,
      agingBucket: agingMonths,
    };

    if (this.data.isEditMode) {
      this.editTermsCodeById(this.data.termsCodeId, createUpdateTermsCodeDto);
      return;
    }
    this.createTermsCode(createUpdateTermsCodeDto);
  }

  createTermsCode(createUpdateTermsCodeDto: CreateUpdateTermsCodeDto) {
    this.termsCodeService
      .create(createUpdateTermsCodeDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toasterService.success('::TermsCode:CreateSuccessMessage');
          this.dialogRef.close();
        },
        error: () => {
          this.toasterService.error('::TermsCode:CreateErrorMessage');
        },
      });
  }

  editTermsCodeById(termsCodeId: string, createUpdateTermsCodeDto: CreateUpdateTermsCodeDto) {
    this.termsCodeService
      .update(termsCodeId, createUpdateTermsCodeDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toasterService.success('::TermsCode:UpdateSuccessMessage');
          this.dialogRef.close();
        },
        error: () => {
          this.toasterService.error('::TermsCode:UpdateErrorMessage');
        },
      });
  }

  onClose(): void {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }
}
