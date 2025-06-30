import { ToasterService } from '@abp/ng.theme.shared';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RxJsSubscriptionUtilService {
  constructor(private toasterService: ToasterService) {}

  getSubscriberHandlers(
    successMessageLocalizationKey: string,
    errorMessageLocalizationKey: string,
  ) {
    return {
      next: () => {
        this.toasterService.success(successMessageLocalizationKey);
      },
      error: () => {
        this.toasterService.error(errorMessageLocalizationKey);
      },
    };
  }
}
