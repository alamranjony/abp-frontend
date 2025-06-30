import { ApiInterceptor, HttpWaitService, AuthService, AbpLocalStorageService } from '@abp/ng.core';
import { HttpRequest, HttpHandler, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, throwError, finalize } from 'rxjs';
import { HttpErrorCode } from '../shared/http-status-code.enum';

@Injectable()
export class CustomApiInterceptor extends ApiInterceptor {
  private _httpWaitService: HttpWaitService;
  constructor(
    httpWaitService: HttpWaitService,
    private authService: AuthService,
    private localStorageService: AbpLocalStorageService,
  ) {
    super(httpWaitService);
    this._httpWaitService = httpWaitService;
  }

  intercept(request: HttpRequest<any>, next: HttpHandler) {
    this._httpWaitService.addRequest(request);

    return next.handle(request).pipe(
      catchError((httpErrorResponse: HttpErrorResponse) => {
        if (httpErrorResponse.status === HttpErrorCode.Unauthorized) {
          this.clearLocalStorage();
          this.authService.logout().subscribe();
        }
        return throwError(() => httpErrorResponse);
      }),
      finalize(() => this._httpWaitService.deleteRequest(request)),
    );
  }

  private clearLocalStorage() {
    this.localStorageService.removeItem('access_token');
    this.localStorageService.removeItem('access_token_stored_at');
    this.localStorageService.removeItem('expires_at');
    this.localStorageService.removeItem('refresh_token');
    this.localStorageService.removeItem('remember_me');
  }
}
