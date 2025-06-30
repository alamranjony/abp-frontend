import { ListService, PagedResultDto } from '@abp/ng.core';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  DeliverySlotService,
  DeliverySlotDto,
  CreateUpdateDeliverySlotDto,
  DeliverySlotCutOffDto,
  DeliveryZoneDto,
  DeliveryZoneService,
} from '@proxy/deliveries';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { finalize, takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ToasterService } from '@abp/ng.theme.shared';
import { forkJoin, Subject } from 'rxjs';

@Component({
  selector: 'app-delivery-slot',
  templateUrl: './delivery-slot.component.html',
  styleUrls: ['./delivery-slot.component.scss'],
  providers: [ListService],
})
export class DeliverySlotComponent implements OnInit, OnDestroy {
  deliverySlots = { items: [], totalCount: 0 } as PagedResultDto<DeliverySlotDto>;
  selectedSlot: DeliverySlotDto | null = null;
  selectedZones: DeliveryZoneDto[] = [];
  deliveryZones: DeliveryZoneDto[] = [];
  timesArray: { id?: string; time: string; period: string }[] = [{ time: '', period: 'AM' }];
  destroy$ = new Subject<void>();

  deliverySlot: DeliverySlotDto;

  constructor(
    public readonly list: ListService,
    private readonly deliverySlotService: DeliverySlotService,
    public readonly dialog: MatDialog,
    private readonly router: Router,
    private readonly toaster: ToasterService,
    private readonly deliveryZoneService: DeliveryZoneService,
    private dialogRef: MatDialogRef<DeliverySlotComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.deliverySlot = data.deliverySlot;
  }

  ngOnInit() {
    const deliverySlotStreamCreator = query => this.deliverySlotService.getList(query);
    this.list.hookToQuery(deliverySlotStreamCreator).subscribe(response => {
      this.deliverySlots = response;
    });
    this.loadSlotZones(this.deliverySlot.id);
    this.loadDeliveryCutOffTimes();
  }

  onZonesSelectionChange(event) {
    this.selectedZones = event.value;
  }

  loadDeliveryCutOffTimes() {
    this.deliverySlotService
      .getDeliverySlotCutOffList(this.deliverySlot.id)
      .subscribe((cutOffTimes: DeliverySlotCutOffDto[]) => {
        this.timesArray = cutOffTimes.map(cutOff => ({
          id: cutOff.id,
          time: cutOff.time?.substring(0, 5) ?? '',
          period: cutOff.period ?? 'AM',
        }));

        if (this.timesArray.length === 0) {
          this.timesArray = [{ time: '', period: 'AM' }];
        }
      });
  }

  loadSlotZones(slotId: string): void {
    forkJoin({
      selectedDeliveryZones: this.deliveryZoneService.getDeliveryZonesBySlotId(slotId),
      availableDeliveryZones: this.deliveryZoneService.getDeliveryZonesNotAssignedToSlots(
        this.deliverySlot.deliveryModeId,
      ),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ selectedDeliveryZones, availableDeliveryZones }) => {
          this.selectedZones = selectedDeliveryZones;
          this.deliveryZones = [...this.selectedZones, ...availableDeliveryZones];
        },
        error: () => {
          this.toaster.error('::DeliverySlotLoadError');
        },
      });
  }

  addMoreTime() {
    this.timesArray.push({ time: '', period: 'AM' });
  }

  removeTime(index: number) {
    if (this.timesArray.length >= 1) {
      const cutoffId = this.timesArray[index].id;
      if (cutoffId) {
        this.deliverySlotService
          .deleteDeliverySlotCutOff(cutoffId)
          .pipe(
            finalize(() => {
              this.timesArray.splice(index, 1);
            }),
          )
          .subscribe();
      } else {
        this.timesArray.splice(index, 1);
      }
    }
  }

  convertToTimeSpanFormat(time: string, period: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    let adjustedHours = hours;
    if (period === 'PM' && hours < 12) {
      adjustedHours += 12;
    } else if (period === 'AM' && hours === 12) {
      adjustedHours = 0; // Handle 12 AM case
    }
    return `${adjustedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  }

  saveDeliverySlot() {
    const invalidTimes = this.timesArray.some(item => !this.isValidTime(item.time));
    if (invalidTimes) {
      this.toaster.error('::DeliverySlotCutOffError');
      return;
    }

    const updateDto: CreateUpdateDeliverySlotDto = {
      name: this.deliverySlot.name,
      cutOffTimes: this.timesArray.map(item => ({
        id: item.id,
        time: this.convertToTimeSpanFormat(item.time, item.period),
        period: item.period,
      })),
      zoneIds: this.selectedZones.map(zone => zone.id),
      deliveryModeId: this.deliverySlot.deliveryModeId,
    };

    this.deliverySlotService
      .setDeliveryCutOff(this.deliverySlot.id, updateDto)
      .pipe(finalize(() => this.refreshDeliverySlots()))
      .subscribe(() => {
        this.loadSlotZones(this.deliverySlot.id);
        this.loadDeliveryCutOffTimes();
        this.toaster.success('::DeliverySlotUpdateSuccess');
        this.close();
      });
  }

  isValidTime(time: string): boolean {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return timeRegex.test(time);
  }

  onNameChange(newName: string) {
    if (this.selectedSlot) {
      this.selectedSlot.name = newName;
    }
  }

  refreshDeliverySlots(callback?: () => void) {
    const deliverySlotStreamCreator = query => this.deliverySlotService.getList(query);
    this.list.hookToQuery(deliverySlotStreamCreator).subscribe(response => {
      this.deliverySlots = response;
      if (callback) {
        callback();
      }
    });
  }

  close() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }
}
