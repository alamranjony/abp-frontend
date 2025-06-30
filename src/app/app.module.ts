import { AuthService, CoreModule } from '@abp/ng.core';
import { SettingManagementConfigModule } from '@abp/ng.setting-management/config';
import { ThemeSharedModule } from '@abp/ng.theme.shared';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { IdentityConfigModule } from '@abp/ng.identity/config';
import { AccountConfigModule } from '@abp/ng.account/config';
import { TenantManagementConfigModule } from '@abp/ng.tenant-management/config';
import { registerLocale } from '@abp/ng.core/locale';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { APP_ROUTE_PROVIDER } from './route.provider';
import { FeatureManagementModule } from '@abp/ng.feature-management';
import { AbpOAuthModule } from '@abp/ng.oauth';
import { ThemeLeptonXModule } from '@abp/ng.theme.lepton-x';
import { SideMenuLayoutModule } from '@abp/ng.theme.lepton-x/layouts';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { IdentityRoleExtendedModule } from './identity-role-extended/identity-role-extended.module';
import { RoleManagementModule } from './role-management/role-management.module';
import { DecimalPipe } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { CustomApiInterceptor } from './interceptors/custom-api.interceptor';
import { CustomAuthService } from './shared/services/custom-auth.service';
import { CommunicationBoxModule } from './communication-box/communication-box.module';
import { TitleStrategy } from '@angular/router';
import { CustomPageTitleStrategy } from './shared/services/custom-page-title-strategy';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    CoreModule.forRoot({
      environment,
      registerLocaleFn: registerLocale(),
    }),
    AbpOAuthModule.forRoot(),
    AccountConfigModule.forRoot(),
    TenantManagementConfigModule.forRoot(),
    IdentityConfigModule.forRoot(),
    ThemeSharedModule.forRoot(),
    SettingManagementConfigModule.forRoot(),
    ThemeLeptonXModule.forRoot(),
    SideMenuLayoutModule.forRoot(),
    FeatureManagementModule.forRoot(),
    IdentityRoleExtendedModule,
    RoleManagementModule,
    CommunicationBoxModule,
  ],
  providers: [
    APP_ROUTE_PROVIDER,
    provideAnimationsAsync(),
    DecimalPipe,
    { provide: HTTP_INTERCEPTORS, useClass: CustomApiInterceptor, multi: true },
    {
      provide: AuthService,
      useClass: CustomAuthService,
    },
    { provide: TitleStrategy, useClass: CustomPageTitleStrategy },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
