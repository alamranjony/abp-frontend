import { ROUNDING_PRECISION } from './constants';

export function formatDecimals(value: number | string | null | undefined): number {
  if (!value) return 0;

  const parsedValue = parseFloat(value as string);
  return isNaN(parsedValue) ? 0 : Number(parsedValue.toFixed(ROUNDING_PRECISION));
}
