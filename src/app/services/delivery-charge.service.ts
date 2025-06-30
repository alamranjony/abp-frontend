import { Injectable } from '@angular/core';
import {
  DeliveryChargeAdjustmentSettingService,
  DeliveryFeeType,
  DeliveryShortCodeDto,
  DeliveryShortCodeService,
  DeliveryZoneDto,
  DeliveryZoneService,
} from '@proxy/deliveries';
import { lastValueFrom } from 'rxjs';
import { DeliveryTimeType } from '@proxy/orders';

@Injectable({
  providedIn: 'root',
})
export class DeliveryChargeService {
  private deliveryCharge: number = 0;
  private adjustmentSettingEnabled: boolean;
  private isDeliveryFeeFromDeliveryZoneApplied: boolean = false;
  private isDeliveryFeeFromShortCodeApplied: boolean = false;

  constructor(
    private readonly deliveryZoneService: DeliveryZoneService,
    private readonly deliveryChargeAdjustmentSettingService: DeliveryChargeAdjustmentSettingService,
    private readonly shortCodeService: DeliveryShortCodeService,
  ) {}

  get getDeliveryCharge(): number {
    return this.deliveryCharge;
  }

  async adjustByDeliveryZone(
    deliveryZone: DeliveryZoneDto,
    deliveryFeeType?: DeliveryFeeType,
    deliveryFromDate?: Date,
    deliveryToDate?: Date,
    time?: {
      hour: number;
      minute: number;
    },
    deliveryTimeType?: DeliveryTimeType,
  ): Promise<void> {
    if (this.isDeliveryFeeFromShortCodeApplied) {
      this.isDeliveryFeeFromDeliveryZoneApplied = false;
      if (deliveryFromDate && deliveryToDate) {
        await this.adjustBySetting(deliveryFromDate, deliveryToDate);
      }
      return;
    }

    this.deliveryCharge = this.getDeliveryFeeByType(deliveryZone, deliveryFeeType);
    this.isDeliveryFeeFromDeliveryZoneApplied = false;

    if (!deliveryFromDate || !deliveryToDate) return;

    if (time) {
      const timeInMinutes = this.getTimeInMinute(time);
      const isCurrentDelivery =
        this.isSameDate(deliveryFromDate, deliveryToDate) && this.isToday(deliveryToDate);
      const isFutureDelivery = this.isFutureDate(deliveryToDate);

      if (isCurrentDelivery || isFutureDelivery) {
        this.deliveryCharge = this.calculateTimeSensitiveFee(
          deliveryZone,
          timeInMinutes,
          deliveryTimeType,
          isFutureDelivery,
        );
      }
    }

    await this.adjustBySetting(deliveryFromDate, deliveryToDate);
  }

  adjustByDeliveryShortCode(deliveryShortCode?: DeliveryShortCodeDto): void {
    if (!deliveryShortCode) {
      this.deliveryCharge = 0;
      this.isDeliveryFeeFromShortCodeApplied = false;
      return;
    }
    if (!deliveryShortCode.useDefaultDeliveryCharge) {
      this.deliveryCharge = deliveryShortCode.specialDeliveryCharge;
      this.isDeliveryFeeFromShortCodeApplied = true;
    } else {
      this.deliveryCharge = 0;
      this.isDeliveryFeeFromShortCodeApplied = false;
    }
  }

  async adjustBySetting(deliveryFromDate: Date, deliveryToDate: Date): Promise<void> {
    try {
      const setting = await lastValueFrom(
        this.deliveryChargeAdjustmentSettingService.getDeliveryChargeAdjustmentSetting(),
      );

      if (setting.isEnabled) {
        if (setting.isIncreaseNow) {
          this.deliveryCharge += setting.priceAdjustment;
        } else {
          const startDate = Date.parse(setting.startDate);
          const endDate = Date.parse(setting.endDate);
          if (deliveryToDate.getDate() >= startDate && deliveryToDate.getDate() <= endDate) {
            this.deliveryCharge += setting.priceAdjustment;
          }
        }
        this.adjustmentSettingEnabled = true;
      }
    } catch (error) {
      throw new Error(error);
    }
  }

  private getDeliveryFeeByType(zone: DeliveryZoneDto, feeType?: DeliveryFeeType): number {
    if (!feeType) return zone.deliveryFee;

    const feeMap = {
      [DeliveryFeeType.Express]: zone.expressDeliveryFee,
      [DeliveryFeeType.Sunday]: zone.sundayDeliveryFee,
      [DeliveryFeeType.Wedding]: zone.weddingDayDeliveryFee,
      [DeliveryFeeType.Future]: zone.futureDeliveryFee,
    };

    return zone.deliveryFee + feeMap[feeType];
  }

  private calculateTimeSensitiveFee(
    zone: DeliveryZoneDto,
    timeInMinutes: number,
    deliveryTimeType: DeliveryTimeType | undefined,
    isFuture: boolean,
  ): number {
    const isEligibleTimeType =
      deliveryTimeType === DeliveryTimeType.Before ||
      deliveryTimeType === DeliveryTimeType.At ||
      deliveryTimeType === DeliveryTimeType.After;

    if (!isEligibleTimeType) return this.deliveryCharge;

    let feeRanges: { minutes: number; fee: number }[];
    if (deliveryTimeType === DeliveryTimeType.After) {
      feeRanges = [
        {
          minutes: 120,
          fee: isFuture ? zone.futureWithin3HrDeliveryFee : zone.within3HrDeliveryFee,
        },
        {
          minutes: 180,
          fee: isFuture ? zone.futureWithin4HrDeliveryFee : zone.within4HrDeliveryFee,
        },
      ];
    } else {
      feeRanges = [
        {
          minutes: 120,
          fee: isFuture ? zone.futureWithin2HrDeliveryFee : zone.within2HrDeliveryFee,
        },
        {
          minutes: 180,
          fee: isFuture ? zone.futureWithin3HrDeliveryFee : zone.within3HrDeliveryFee,
        },
        {
          minutes: 240,
          fee: isFuture ? zone.futureWithin4HrDeliveryFee : zone.within4HrDeliveryFee,
        },
      ];
    }

    for (const { minutes, fee } of feeRanges) {
      if (timeInMinutes <= minutes) {
        return zone.deliveryFee + fee;
      }
    }

    return this.deliveryCharge;
  }

  private getTimeInMinute(time: { hour: number; minute: number }): number {
    return time.hour * 60 + time.minute;
  }

  private isSameDate(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  private isToday(date: Date): boolean {
    return this.isSameDate(date, new Date());
  }

  private isFutureDate(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  }
}
