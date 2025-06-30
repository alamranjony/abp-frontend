import { mapEnumToOptions } from '@abp/ng.core';

export enum OccasionsType {
  Wedding = 1,
  Birthday = 2,
  Holiday = 3,
  Anniversary = 4,
  Business = 5,
  NewBaby = 6,
  GetWell = 7,
  Funeral = 8,
  Other = 9,
}

export const occasionsTypeOptions = mapEnumToOptions(OccasionsType);
