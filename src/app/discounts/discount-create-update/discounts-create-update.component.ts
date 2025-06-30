import { ToasterService } from '@abp/ng.theme.shared';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CreateUpdateDiscountDto,
  DiscountApplicationType,
  DiscountDto,
  DiscountService,
  DiscountStatus,
  discountStatusOptions,
  DiscountType,
  discountTypeOptions,
} from '@proxy/discounts';
import { sortEnumValues } from 'src/app/shared/common-utils';

@Component({
  selector: 'app-discount-create',
  templateUrl: './discounts-create-update.component.html',
  styleUrls: ['./discounts-create-update.component.scss'],
})
export class DiscountsCreateUpdateComponent implements OnInit {
  form: FormGroup;
  discountTypeOptions = sortEnumValues(discountTypeOptions);
  discountStatusOptions = sortEnumValues(discountStatusOptions);
  discountId: string;

  constructor(
    private fb: FormBuilder,
    private discountService: DiscountService,
    private toasterService: ToasterService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.discountId = this.activatedRoute.snapshot.paramMap.get('discountId');
    this.buildForm();
    if (this.discountId) this.getDiscountById(this.discountId);
  }

  buildForm() {
    this.form = this.fb.group({
      discountCode: [null, Validators.required],
      discountType: [DiscountType.Amount, Validators.required],
      discountAmount: [0, Validators.required],
      discountStatus: [DiscountStatus.Active, Validators.required],
      startDate: [new Date(), Validators.required],
      endDate: [new Date(), Validators.required],
      discountApplicationType: [DiscountApplicationType.Item, Validators.required],
      description: [],
    });
  }

  getDiscountById(discountId: string) {
    this.discountService.get(discountId).subscribe({
      next: (discountDto: DiscountDto) => {
        this.form.patchValue(discountDto);
      },
    });
  }

  onSaveBtnClick() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toasterService.error('::ValidationError:InvalidFormOrData');
      return;
    }

    let startDate = new Date(this.form.value.startDate);
    let endDate = new Date(this.form.value.endDate);

    if (startDate > endDate) {
      this.toasterService.error('::Discount:DateValidationErrMessage');
      return;
    }

    if (this.discountId) this.updateDiscount();
    else this.createDiscount();
  }

  createDiscount() {
    let createUpdateDto = this.form.value as CreateUpdateDiscountDto;
    createUpdateDto.startDate = new Date(createUpdateDto.startDate).toDateString();
    createUpdateDto.endDate = new Date(createUpdateDto.endDate).toDateString();

    let subscriptionObj = this.prepareSubscriptionHandlerObj(
      '::Discount:CreateSuccessMessage',
      '::Discount:SaveErrorMessage',
    );
    this.discountService.create(createUpdateDto).subscribe(subscriptionObj);
  }

  updateDiscount() {
    if (this.discountId) {
      let createUpdateDto = this.form.value as CreateUpdateDiscountDto;
      createUpdateDto.startDate = new Date(createUpdateDto.startDate).toDateString();
      createUpdateDto.endDate = new Date(createUpdateDto.endDate).toDateString();

      let subscriptionObj = this.prepareSubscriptionHandlerObj(
        '::Discount:UpdateSuccessMessage',
        '::Discount:SaveErrorMessage',
      );
      this.discountService.update(this.discountId, createUpdateDto).subscribe(subscriptionObj);
    }
  }

  prepareSubscriptionHandlerObj(
    successMessageLocalizationKey: string,
    errorMessageLocalizationKey: string,
  ) {
    return {
      next: () => {
        this.toasterService.success(successMessageLocalizationKey);
        this.router.navigate(['/discounts']);
      },
      error: () => {
        this.toasterService.error(errorMessageLocalizationKey);
      },
    };
  }
}
