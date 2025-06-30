import * as XLSX from 'xlsx';

export function getDateFromDateTime(dateTime: string | Date) {
  const date = new Date(dateTime);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function convertExcelDate(value: any): any {
  if (!value) return null;

  if (typeof value === 'number' && value > 30000) {
    const date = XLSX.SSF.parse_date_code(value);
    const formattedDate = `${date.m.toString().padStart(2, '0')}/${date.d.toString().padStart(2, '0')}/${date.y}`;
    return formattedDate;
  }

  return value;
}

export function formatDate(dateTime: string): string {
  if (!dateTime) return '';

  const localDate = new Date(dateTime);
  const month = (localDate.getMonth() + 1).toString().padStart(2, '0');
  const day = localDate.getDate().toString().padStart(2, '0');
  const year = localDate.getFullYear();

  return `${month}/${day}/${year}`;
}

export function getCurrentTime(): string {
  return new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatDateTime(dateTimeStr: string | Date): string {
  const date = new Date(dateTimeStr);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date string');
  }

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
