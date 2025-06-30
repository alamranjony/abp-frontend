import { ABP } from '@abp/ng.core';
import { OrderType } from '@proxy/orders';

export function sortEnumValues(data: any, sortType: string = 'asc'): ABP.Option<any>[] {
  if (!data) return;

  return sortType === 'asc'
    ? data.sort((a, b) => a.key.localeCompare(b.key))
    : data.sort((a, b) => b.key.localeCompare(a.key));
}

export function getFormatedDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}

export function getFormatedTime(date: string) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export class permissions {
  static readonly TimeCardSelfReport = 'ClientPortal.Payrolls.TimeCardSelfReport';
  static readonly TimeCardSelfReportEdit = 'ClientPortal.Payrolls.TimeCardSelfReportEdit';
  static readonly TimeCardOtherReport = 'ClientPortal.Payrolls.TimeCardOtherReport';
  static readonly TimeCardOtherReportEdit = 'ClientPortal.Payrolls.TimeCardOtherReportEdit';
  static readonly DeliveryModelCalender = 'ClientPortal.DeliveryModeDateMap.Edit';
}

export function getEnumDisplayName(enumOptions: any[], enumValue: number): string {
  const option = enumOptions.find(option => option.value === enumValue);
  return option ? option.key : '-';
}

export function isDesignModuleNotApplicable(orderType: OrderType) {
  return (
    orderType === OrderType.IV ||
    orderType === OrderType.IVCR ||
    orderType === OrderType.SWCR ||
    orderType === OrderType.PU
  );
}
