import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Papa } from 'ngx-papaparse';
import { type PagedResultDto, RestService } from '@abp/ng.core';
import { customerAccountTypeOptions } from '@proxy/customers';
import { formatDate } from '../shared/date-time-utils';
import {
  deliveryCategoryOptions,
  orderDeliveryStatusOptions,
  orderStatusOptions,
  orderTypeOptions,
} from '@proxy/orders';
import { occasionCodeOptions } from '@proxy/recipients';
import { wireServiceOptions } from '@proxy/common';

@Injectable({
  providedIn: 'root',
})
export class CsvExportService {
  constructor(
    private papa: Papa,
    private restService: RestService,
  ) {}

  fetchData(
    apiUrl: string,
    queryParams: { [key: string]: any } = {},
    hasQueryParams: boolean = true,
    isCustomMethodWithParam: boolean = false,
  ): Observable<PagedResultDto<any>> {
    queryParams = queryParams || {};

    if (!queryParams.hasOwnProperty('skipCount')) {
      queryParams['skipCount'] = 0;
    }
    if (!queryParams.hasOwnProperty('maxResultCount')) {
      queryParams['maxResultCount'] = 1000;
    }

    let url = `/api/${apiUrl}`;
    const defaultApiName = 'Default';
    let params = new HttpParams();
    for (const key in queryParams) {
      if (queryParams.hasOwnProperty(key)) {
        params = params.set(key, queryParams[key].toString());
      }
    }

    let paramsValue = {};
    if (!isCustomMethodWithParam) {
      paramsValue = {
        filter: null,
        sorting: null,
        skipCount: queryParams['skipCount'],
        maxResultCount: queryParams['maxResultCount'],
      };
    } else {
      paramsValue = { ...queryParams };
    }

    return this.restService.request<any, PagedResultDto<any>>(
      {
        method: 'GET',
        url: url,
        params: hasQueryParams ? paramsValue : {},
      },
      { apiName: defaultApiName },
    );
  }

  exportToCsv(
    filename: string,
    rows: any[],
    fieldList?: string[],
    displayColumns?: string[],
  ): void {
    if (!rows || !rows.length) return;
    let filteredRows = rows;
    if (fieldList?.length > 0) {
      filteredRows = this.filterFields(rows, fieldList);
    }

    const headers =
      displayColumns?.length > 0
        ? displayColumns
        : fieldList?.map(this.convertToPascalCaseWithSpace) ||
          Object.keys(filteredRows[0]).map(this.convertToPascalCaseWithSpace);

    const transformedRows = filteredRows.map(row => {
      const transformedRow = {};
      (fieldList || Object.keys(row)).forEach((key, index) => {
        transformedRow[headers[index]] = this.processKey(key, row);
      });
      return transformedRow;
    });
    const csv = this.papa.unparse(transformedRows, {
      header: true,
    });

    this.downloadCsv(filename, csv);
  }

  private filterFields(rows: any[], fieldList: string[]): any[] {
    return rows.map(row => {
      const filteredRow = {};
      fieldList.forEach(field => {
        filteredRow[field] = row[field];
      });
      return filteredRow;
    });
  }

  private downloadCsv(filename: string, csv: string): void {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private convertToPascalCaseWithSpace(fieldName: string): string {
    return fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }

  private convertToLocalTime(utcDateTime: string): string {
    const localDate = new Date(utcDateTime);
    return localDate.toLocaleString(); // Customize the format as needed
  }

  exportToCsvTemplate(filename: string, fieldList: string[]): void {
    const pascalCaseHeaders = fieldList.map(this.convertToPascalCaseWithSpace);

    const headerRows = fieldList.reduce((acc, key, index) => {
      acc[pascalCaseHeaders[index].trim()] = '';
      return acc;
    }, {});

    const csv = this.papa.unparse([headerRows], {
      header: true,
    });

    this.downloadCsv(filename, csv);
  }

  private getEnumDisplayName(enumOptions: any[], enumValue: number): string {
    const option = enumOptions.find(option => option.value === enumValue);
    return option ? option.key : 'Unknown';
  }

  private processKey(key, row) {
    switch (key) {
      case 'checkoutTime':
      case 'currentTime':
        return this.convertToLocalTime(row[key]);

      case 'accountOpenDateTime':
      case 'lastStatementDate':
      case 'lastPurchaseDate':
      case 'lastPaymentDate':
      case 'deliveryDate':
        return formatDate(row[key]);

      case 'customerAccountType':
        return this.getEnumDisplayName(customerAccountTypeOptions, row[key]);

      case 'useDefaultDeliveryCharge':
      case 'taxExempt':
      case 'hasDeliveryCharge':
      case 'isWholeSale':
        return row[key] ? 'YES' : 'NO';
      case 'orderType':
        return this.getEnumDisplayName(orderTypeOptions, row[key]);
      case 'orderStatus':
        return this.getEnumDisplayName(orderStatusOptions, row[key]);
      case 'subOrderDeliveryStatus':
        return this.getEnumDisplayName(orderDeliveryStatusOptions, row[key]);
      case 'deliveryCategory':
        return this.getEnumDisplayName(deliveryCategoryOptions, row[key]);
      case 'occasionCode':
        return this.getEnumDisplayName(occasionCodeOptions, row[key]);
      case 'wireService':
        return this.getEnumDisplayName(wireServiceOptions, row[key]);
      default:
        return row[key];
    }
  }
}
