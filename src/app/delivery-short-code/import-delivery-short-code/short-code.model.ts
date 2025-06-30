export interface ImportShortCodeDto {
  ShortCode: string;
  LocationName: string;
  Address1: string;
  Address2?: string;
  Country: string;
  StateProvince: string;
  City: string;
  ZipCode: string;
  TypeofDelivery: string;
  PhoneNumber?: string;
  SpecialInstruction?: string;
  UseDefaultDeliveryCharge: boolean;
  SpecialDeliveryCharge: number;
  StoreCode?: string;
  DeliveryZone?: string;
}

export interface JsonRow {
  [key: string]: string | number | null | undefined;
}
