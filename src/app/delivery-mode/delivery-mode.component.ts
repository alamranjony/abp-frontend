import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  DeliveryModeService,
  DeliveryModeDto,
  CreateUpdateDeliveryModeDto,
  DeliverySlotService,
  DeliverySlotDto,
} from '@proxy/deliveries';
import { PagedAndSortedResultRequestDto, PagedResultDto } from '@abp/ng.core';
import { DeliveryModeDialogComponent } from './delivery-mode-dialog/delivery-mode-dialog.component';
import { ToasterService } from '@abp/ng.theme.shared';
import { DeliverySlotComponent } from '../delivery-slot/delivery-slot.component';
import { DeliverySlotDialogComponent } from '../delivery-slot/delivery-slot-dialog/delivery-slot-dialog.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-delivery-mode',
  templateUrl: './delivery-mode.component.html',
  styleUrls: ['./delivery-mode.component.scss'],
})
export class DeliveryModeComponent implements OnInit, OnDestroy {
  deliveryMode: PagedResultDto<DeliveryModeDto> = { items: [], totalCount: 0 };
  deliverySlots: DeliverySlotDto[] = [];
  selectedMode: DeliveryModeDto | null = null;
  selectedSlots: DeliverySlotDto[] = [];
  pagedRequest: PagedAndSortedResultRequestDto = { maxResultCount: 10, skipCount: 0, sorting: '' };
  columns: string[] = ['name', 'zones', 'actions'];
  destroy$: Subject<void> = new Subject();

  constructor(
    private dialog: MatDialog,
    private deliveryModeService: DeliveryModeService,
    private deliverySlotService: DeliverySlotService,
    private toaster: ToasterService,
  ) {}

  ngOnInit(): void {
    this.getDeliveryModes();
  }

  getDeliveryModes(newlyCreatedModeId?: string): void {
    this.deliveryModeService
      .getList(this.pagedRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.deliveryMode.items = result.items;
        if (newlyCreatedModeId) {
          this.selectedMode =
            this.deliveryMode.items.find(mode => mode.id === newlyCreatedModeId) || null;
        }
        if (this.selectedMode && !newlyCreatedModeId) {
          this.selectedMode =
            this.deliveryMode.items.find(mode => mode.id === this.selectedMode?.id) || null;
        }
        if (this.selectedMode) {
          this.loadModeSlots(this.selectedMode.id);
        } else {
          this.selectedSlots = [];
        }
      });
  }

  openAddSlotDialog() {
    const dialogRef = this.dialog.open(DeliverySlotDialogComponent, {
      width: '400px',
      data: { deliveryModeId: this.selectedMode?.id },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result?.success) {
          this.loadModeSlots(this.selectedMode?.id!);
          this.toaster.success('::DeliverySlotCreateSuccess');
        }
      });
  }

  onClickEditSlotBtn(deliverySlotDto: DeliverySlotDto): void {
    const dialogRef = this.dialog.open(DeliverySlotComponent, {
      width: '40%',
      data: { deliverySlot: deliverySlotDto },
    });
    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.loadModeSlots(this.selectedMode.id);
      });
  }

  onModeSelectionChange(): void {
    if (this.selectedMode?.id) {
      this.loadModeSlots(this.selectedMode.id);
    } else {
      this.deliverySlots = [];
    }
  }

  loadModeSlots(modeId: string): void {
    this.deliverySlotService
      .getDeliverySlots(modeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: slots => {
          this.deliverySlots = slots;
        },
      });
  }

  onNameChange(newName: string): void {
    if (this.selectedMode) {
      this.selectedMode.name = newName;
    }
  }

  onSlotsSelectionChange(event: any): void {
    this.selectedSlots = event.value;
  }

  saveDeliveryMode(): void {
    if (!this.selectedMode) return;
    const input: CreateUpdateDeliveryModeDto = {
      id: this.selectedMode.id,
      name: this.selectedMode.name,
      tenantId: this.selectedMode.tenantId,
      deliverySlotModeMaps: this.selectedSlots.map(slot => ({
        deliverySlotId: slot.id,
        deliveryModeId: this.selectedMode!.id!,
      })),
    };

    if (this.selectedMode.id) {
      this.deliveryModeService
        .update(this.selectedMode.id, input)
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          () => {
            this.getDeliveryModes(this.selectedMode.id);
            this.toaster.success('::DeliveryModeUpdateSuccess');
          },
          error => {
            this.toaster.error('::DeliveryModeSaveError');
          },
        );
    } else {
      this.deliveryModeService
        .create(input)
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          newMode => {
            this.getDeliveryModes(newMode.id);
            this.toaster.success('::DeliveryModeCreateSuccess');
          },
          error => {
            this.toaster.error('::DeliveryModeSaveError');
          },
        );
    }
  }

  deleteDeliveryMode(): void {
    if (this.selectedMode && this.selectedMode.id) {
      this.deliveryModeService
        .delete(this.selectedMode.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          () => {
            this.getDeliveryModes();
            this.selectedMode = null;
            this.selectedSlots = [];
          },
          error => {
            this.toaster.error('::DeliveryModeDeleteError');
          },
        );
    }
  }

  openAddModeDialog(): void {
    const dialogRef = this.dialog.open(DeliveryModeDialogComponent, {
      width: '400px',
      data: { mode: null },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.getDeliveryModes(result.id);
        this.toaster.success('::DeliveryModeCreateSuccess');
      }
    });
  }

  onClickDeleteBtn(slotId: string) {
    this.deliverySlotService
      .delete(slotId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadModeSlots(this.selectedMode?.id!);
          this.toaster.success('::DeliverySlotDeleteSuccess');
        },
        error: () => {
          this.toaster.error('::DeliverySlotDeleteError');
        },
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
