import { Component } from '@angular/core';
import { AuthService, LocalizationService } from '@abp/ng.core';
import { SharedModule } from '../shared/shared.module';
import { environment } from 'src/environments/environment';
import { ToasterService } from '@abp/ng.theme.shared';
import { LOGO_URL } from '../shared/constants';

@Component({
  selector: 'app-custom-login',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './custom-login.component.html',
  styleUrl: './custom-login.component.scss',
})
export class CustomLoginComponent {
  username: string = '';
  password: string = '';
  rememberMe: boolean = false;
  logoUrl = LOGO_URL;

  constructor(
    private readonly authService: AuthService,
    private readonly toasterService: ToasterService,
    private readonly localizationService: LocalizationService,
  ) {}

  onSubmit() {
    const grantType = 'password';
    const parameters = {
      username: this.username,
      password: this.password,
      rememberMe: this.rememberMe,
      scope: environment?.oAuthConfig?.scope,
      client_id: environment?.oAuthConfig?.clientId,
    };

    this.authService
      .loginUsingGrant(grantType, parameters)
      .then(response => {
        window.location.reload();
      })
      .catch(error => {
        let errorMessage = this.extractErrorMessage(error);
        this.toasterService.error(errorMessage);
      });
  }

  private extractErrorMessage(error: any): string {
    const defaultMessage = this.localizationService.instant('::Login:LoginFailed');

    if (!error) return defaultMessage;

    const messageFromAbp = error?.error?.error?.message;
    const isInvalidGrant = error?.error?.error === 'invalid_grant';
    const invalidGrantMessage = error?.error?.error_description;
    const messageFromResponseData = error?.response?.data?.error?.message;
    const isNetworkError = error?.message?.includes('Network Error');

    if (messageFromAbp) {
      return messageFromAbp;
    }

    if (isInvalidGrant) {
      return invalidGrantMessage || this.localizationService.instant('::Login:InvalidCredentials');
    }

    if (messageFromResponseData) {
      return messageFromResponseData;
    }

    if (isNetworkError) {
      return this.localizationService.instant('::Login:NetworkError');
    }

    return defaultMessage;
  }
}
