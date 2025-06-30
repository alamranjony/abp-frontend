import { mapEnumToOptions } from '@abp/ng.core';

export enum StepType {
  Step1 = 1,
  Step2,
  Step3,
  Step4,
  Step5,
}

export enum ActionType {
  Print = 'print',
  Pdf = 'pdf',
}

export const stepTypeOptions = mapEnumToOptions(StepType);
export const actionTypeOptions = mapEnumToOptions(ActionType);
