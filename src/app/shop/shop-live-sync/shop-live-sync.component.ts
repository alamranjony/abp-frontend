import { ToasterService } from '@abp/ng.theme.shared';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { ShopService } from '@proxy/shops';
import { Subject, takeUntil } from 'rxjs';
import { SharedModule } from 'src/app/shared/shared.module';

@Component({
  selector: 'app-shop-live-sync',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './shop-live-sync.component.html',
  styleUrl: './shop-live-sync.component.scss',
})
export class ShopLiveSyncComponent implements OnInit, OnDestroy {
  formGroup: FormGroup;
  destroy$: Subject<void> = new Subject();

  constructor(
    private readonly fb: FormBuilder,
    private readonly shopService: ShopService,
    private readonly toasterService: ToasterService,
    private readonly dialogRef: MatDialogRef<ShopLiveSyncComponent>,
  ) {}

  ngOnInit(): void {
    this.initializeFormGroup();
  }

  private initializeFormGroup() {
    this.formGroup = this.fb.group({
      availabilityDate: [null, Validators.required],
      zipCode: [null, Validators.required],
      city: [null],
      state: [null],
    });
  }

  onSubmit() {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      this.toasterService.error('::ValidationError:InvalidFormOrData');
      return;
    }

    const availableDate = this.formGroup.value.availabilityDate.toDateString();
    const zipCode = this.formGroup.value.zipCode;
    const city = this.formGroup.value.city;
    const state = this.formGroup.value.state;

    if (this.formGroup.valid) {
      this.shopService
        .liveShopSyncForBloomNet(availableDate, zipCode, city, state)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toasterService.success('::Shop:LiveSyncSuccess');
          },
          error: () => {
            this.toasterService.error('::Shop:LiveSyncError');
          },
          complete: () => {
            this.dialogRef.close();
          },
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
