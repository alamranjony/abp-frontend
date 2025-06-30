import { mapEnumToOptions } from '@abp/ng.core';

export enum PrintOption {
  OrderWithNotepadDetails = 1,
  OrderWithoutNotepadDetails,
  CustomerCopy,
  PrintCardMessage,
  PrintPOSReceipt,
}

export const printOptions = mapEnumToOptions(PrintOption);
