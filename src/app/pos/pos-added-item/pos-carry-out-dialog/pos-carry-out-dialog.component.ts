import { Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DeliveryZoneDto } from '@proxy/deliveries';
import { MessageShortCutDto, MessageShortCutService } from '@proxy/message-short-cuts';
import { numberTypeOptions } from '@proxy/phone-directories';
import {
  CreateUpdateRecipientPersonalizationDto,
  locationTypeOptions,
  RecipientPersonalizationDto,
} from '@proxy/recipients';
import { StoreLookupDto } from '@proxy/stores';
import { occasionCodeOptions } from '@proxy/recipients';
import { CreateUpdateShippingDetailsDto, DeliveryCategory, SubOrderService } from '@proxy/orders';
import { sortEnumValues } from 'src/app/shared/common-utils';

@Component({
  selector: 'app-pos-carry-out-dialog',
  templateUrl: './pos-carry-out-dialog.component.html',
  styleUrl: './pos-carry-out-dialog.component.scss',
})
export class PosCarryOutDialogComponent implements OnInit {
  deliveryAddressForm: FormGroup;
  deliveryDetailsForm: FormGroup;
  orderPersonalizationForm: FormGroup;
  isAddMode: boolean;
  productId: string;
  occasions = sortEnumValues(occasionCodeOptions);
  recipientPersonalizationFormArray: FormArray;
  maxRecipients: number;
  locationTypes = locationTypeOptions;
  numberTypes = numberTypeOptions;
  availableStores: StoreLookupDto[];
  availableZones: DeliveryZoneDto[];
  shortCodes: MessageShortCutDto[] = [];

  constructor(
    private readonly fb: FormBuilder,
    public dialogRef: MatDialogRef<PosCarryOutDialogComponent>,
    private readonly messageShortCutService: MessageShortCutService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private subOrderService: SubOrderService,
  ) {
    this.isAddMode = !data?.recipient;
    this.productId = data?.subOrderItem.productId;
    this.maxRecipients = data?.subOrderItem.qty;
    this.messageShortCutService.getAllList().subscribe(res => (this.shortCodes = res.items));
  }

  ngOnInit(): void {
    this.buildForm();
  }

  buildForm() {
    if (this.data.personalizations.length === 0) {
      this.recipientPersonalizationFormArray = this.fb.array([
        this.createRecipientPersonalizationForm(),
      ]);
    } else {
      this.recipientPersonalizationFormArray = this.fb.array(
        this.data.personalizations.map((personalization: RecipientPersonalizationDto) => {
          return this.fb.group({
            id: [null],
            recipientName: [''],
            shortCodeId: [''],
            cardMessage: [''],
          });
        }),
      );
    }

    this.orderPersonalizationForm = this.fb.group({
      occasion: [this.data?.subOrderItem?.occasionCode || ''],
      copyCardMessage: [this.data?.recipient?.recipientPersonalization?.copyCardMessage || false],
      recipientPersonalization: this.recipientPersonalizationFormArray,
    });

    this.recipientPersonalizationFormArray.patchValue(this.data.personalizations);
  }

  createRecipientPersonalizationForm(): FormGroup {
    return this.fb.group({
      recipientName: [''],
      shortCodeId: [''],
      cardMessage: [''],
    });
  }

  addRecipientForm(): void {
    if (this.recipientPersonalizationFormArray.length < this.maxRecipients) {
      this.recipientPersonalizationFormArray.push(this.createRecipientPersonalizationForm());
    }
  }

  removeRecipientForm(index: number): void {
    if (this.recipientPersonalizationFormArray.length > 1) {
      this.recipientPersonalizationFormArray.removeAt(index);
    }
  }

  onShortCodeChange(selectedCodeId: string, index: number) {
    if (selectedCodeId) {
      const shortCode = this.shortCodes.find(x => x.id === selectedCodeId);
      this.recipientPersonalizationFormArray
        .at(index)
        .get('cardMessage')
        ?.setValue(shortCode.description);
    }
  }

  onSave(): void {
    if (this.orderPersonalizationForm.valid) {
      this.setSubOrderDeliveryDetails();
    }
  }

  setSubOrderDeliveryDetails() {
    let createRecipientPersonalizationDtos: CreateUpdateRecipientPersonalizationDto[] = [];
    this.recipientPersonalizationFormArray.value.forEach(element => {
      createRecipientPersonalizationDtos.push({
        ...element,
        subOrderId: this.data?.subOrderItem?.id,
      });
    });

    let createUpdateShippingDetailsDto: CreateUpdateShippingDetailsDto = {
      deliveryCategory: DeliveryCategory.CarryOut,
      createUpdateRecipientDto: undefined,
      createUpdateRecipientDeliveryDetailDto: undefined,
      createUpdateRecipientPersonalizationDtos: createRecipientPersonalizationDtos,
    };
    this.subOrderService
      .setShippingDetailsBySubOrderIdAndCreateUpdateShippingDetailsDto(
        this.data?.subOrderItem?.id,
        createUpdateShippingDetailsDto,
      )
      .subscribe(x => {
        this.dialogRef.close({
          recipientPersonalizationDtos: x.recipientPersonalizationDtos,
          occasion: this.orderPersonalizationForm.value.occasion,
        });
      });
  }

  duplicateRecipientForm(index: number): void {
    if (this.recipientPersonalizationFormArray.length >= this.maxRecipients) return;

    const sourceGroup = this.recipientPersonalizationFormArray.at(index);
    const newGroup = this.createRecipientPersonalizationForm();
    newGroup.patchValue(sourceGroup.value);

    this.recipientPersonalizationFormArray.insert(index + 1, newGroup);
  }
}
