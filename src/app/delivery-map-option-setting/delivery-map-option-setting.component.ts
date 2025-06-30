import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, Validators } from '@angular/forms';
import { ToasterService } from '@abp/ng.theme.shared';
import { TomTomApiKeySettingsService } from '@proxy/tom-tom';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-delivery-map-option-setting',
  templateUrl: './delivery-map-option-setting.component.html',
})
export class DeliveryMapOptionSettingComponent implements OnInit {
  form: FormGroup;
  isHost: boolean = false;
  hideStates: boolean[] = [true];
  destroy$: Subject<void> = new Subject();

  constructor(
    private readonly fb: FormBuilder,
    private readonly toaster: ToasterService,
    private readonly tomTomApiKeyService: TomTomApiKeySettingsService,
  ) {}

  ngOnInit(): void {
    this.getDeliveryMapOptionSetting();
    this.buildForm();
  }

  getDeliveryMapOptionSetting() {
    this.tomTomApiKeyService
      .getMapOptionsApiKey()
      .pipe(takeUntil(this.destroy$))
      .subscribe(deliveryMapSetting => {
        this.form.patchValue({
          apiKey: deliveryMapSetting.apiKey,
        });
        this.isHost = deliveryMapSetting.tenantId === null;

        if (deliveryMapSetting.alternativeKeys) {
          this.apiKeys.clear();
          deliveryMapSetting.alternativeKeys.forEach((key: string) => {
            this.apiKeys.push(this.fb.control(key, Validators.required));
            this.hideStates.push(true);
          });
        }
      });
  }

  buildForm() {
    this.form = this.fb.group({
      apiKey: ['', Validators.required],
      alternativeKeys: this.fb.array([]),
    });
  }

  get apiKeys(): FormArray {
    return this.form.get('alternativeKeys') as FormArray;
  }

  addApiKey() {
    this.apiKeys.push(this.fb.control('', Validators.required));
    this.hideStates.push(true);
  }

  removeApiKey(index: number) {
    this.apiKeys.removeAt(index);
    this.hideStates.splice(index, 1);
  }

  toggleVisibility(index: number) {
    this.hideStates[index] = !this.hideStates[index];
  }

  save() {
    if (this.form.invalid) {
      this.form.markAsTouched();
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }

    const request = this.tomTomApiKeyService.create(this.form.value);
    request.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.getDeliveryMapOptionSetting();
        this.toaster.success('::DeliveryMapOptionSettingSavedSuccessfully');
      },
      error: () => {
        this.toaster.error('::DeliveryMapOptionSettingSaveError');
      },
    });
  }
}
