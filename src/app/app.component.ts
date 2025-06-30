import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  Renderer2,
} from '@angular/core';
import {
  AuthService,
  ConfigStateService,
  CurrentUserDto,
  LocalizationService,
  ReplaceableComponentsService,
  RoutesService,
} from '@abp/ng.core';
import { PermissionManagementComponent } from './permission-management/permission-management.component';
import { ePermissionManagementComponents } from '@abp/ng.permission-management';
import { RoleManagementComponent } from './role-management/role-management/role-management.component';
import { eIdentityComponents } from '@abp/ng.identity';
import { eThemeSharedRouteNames, NavItemsService } from '@abp/ng.theme.shared';
import { TopBarStoreSelectComponent } from './top-bar-store-select/top-bar-store-select.component';
import { UserProfileMenuComponent } from './user-profile-menu/user-profile-menu.component';
import { concatMap, of, Subject, switchMap, takeUntil, takeWhile, timer } from 'rxjs';
import { CorporateSettingService } from '@proxy/corporate-settings';
import { SharedDataService } from './pos/shared-data.service';
import { IdentitySessionService } from '@proxy/identity-sessions';
import { TopBarTimeClockComponent } from './time-clock/top-bar-time-clock/top-bar-time-clock.component';
import { GlobalSearchBarComponent } from './global-search/global-search-bar/global-search-bar.component';
import { CommunicationBoxComponent } from './communication-box/communication-box.component';
import { ADMIN_ROLE_NAME } from './shared/constants';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  template: `
    <abp-loader-bar></abp-loader-bar>
    <abp-dynamic-layout></abp-dynamic-layout>
  `,
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  destroy$ = new Subject<void>();
  timerDestroy$ = new Subject<void>();
  idleTimeMaxDurationInSeconds: number;
  timerCount: number;
  startDue: number = 0;
  intervalDuration: number = 1000;
  currentUser: CurrentUserDto;

  constructor(
    private replaceableComponents: ReplaceableComponentsService,
    private readonly navItems: NavItemsService,
    private readonly authService: AuthService,
    private readonly renderer: Renderer2,
    private readonly elementRef: ElementRef,
    private corporateSettingService: CorporateSettingService,
    private identitySessionService: IdentitySessionService,
    private configState: ConfigStateService,
    private sharedDataService: SharedDataService,
    private routes: RoutesService,
    private localizationService: LocalizationService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.replaceableComponents.add({
      component: PermissionManagementComponent,
      key: ePermissionManagementComponents.PermissionManagement,
    });

    this.replaceableComponents.add({
      component: RoleManagementComponent,
      key: eIdentityComponents.Roles,
    });

    if (this.authService.isAuthenticated) {
      this.navItems.addItems([
        {
          id: 'top-bar-global-search',
          order: 1,
          component: GlobalSearchBarComponent,
          name: 'TopBarGlobalSearch',
        },
      ]);

      this.navItems.addItems([
        {
          id: 'top-bar-store-select',
          order: 1,
          component: TopBarStoreSelectComponent,
          name: 'TopBarStoreSelect',
        },
        {
          id: 'top-bar-time-clock',
          order: 2,
          component: TopBarTimeClockComponent,
          name: 'TopBarTimeClock',
        },
        {
          id: 'user-profile-menu',
          order: 3,
          component: UserProfileMenuComponent,
          name: 'UserProfileMenu',
        },
        {
          id: 'communication-box',
          order: 4,
          component: CommunicationBoxComponent,
          name: 'CommunicationBox',
        },
      ]);

      this.loadCorporateSettings();
    }

    this.currentUser = this.configState.getOne('currentUser') as CurrentUserDto;
    this.populateAdministrationMenu();

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        setTimeout(() => this.applyMenuTooltips(), 0);
      }
    });
  }

  private loadCorporateSettings() {
    this.corporateSettingService
      .getCorporateSetting()
      .pipe(takeUntil(this.destroy$))
      .subscribe(x => {
        if (this.authService.isAuthenticated) {
          this.idleTimeMaxDurationInSeconds = x.maxIdleTimeBeforeSessionTimeout * 60;
          this.startTimer();
        }

        this.sharedDataService.setCorporateSettings(x);
      });
  }

  @HostListener('document:keyup', ['$event'])
  @HostListener('document:click', ['$event'])
  @HostListener('document:wheel', ['$event'])
  resetTimer() {
    if (!this.authService.isAuthenticated) return;

    this.timerDestroy$.next();
    this.timerDestroy$.complete();
    this.timerDestroy$ = new Subject<void>();
    this.startTimer();
  }

  private startTimer() {
    timer(0, 1000)
      .pipe(
        takeWhile(value => value <= this.idleTimeMaxDurationInSeconds),
        switchMap(value => {
          this.timerCount = value;
          if (this.timerCount === this.idleTimeMaxDurationInSeconds) {
            return this.identitySessionService
              .resetUserSession(this.currentUser.id)
              .pipe(concatMap(() => this.authService.logout()));
          }
          return of(null);
        }),
        takeUntil(this.timerDestroy$),
      )
      .subscribe();
  }

  private populateAdministrationMenu() {
    const accessToken = this.authService.getAccessToken();
    if (!accessToken) return;

    const payload = accessToken.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    const roles = decoded['role'];

    const hasAdminRole = Array.isArray(roles)
      ? roles.includes(ADMIN_ROLE_NAME)
      : roles === ADMIN_ROLE_NAME;

    this.routes.patch(eThemeSharedRouteNames.Administration, {
      invisible: !hasAdminRole,
    });
  }

  ngAfterViewInit(): void {
    const userProfile = this.elementRef.nativeElement.querySelector('abp-user-profile');
    if (userProfile) {
      this.renderer.removeChild(userProfile.parentNode, userProfile);
    }

    setTimeout(() => this.applyMenuTooltips(), 0);
  }

  private applyMenuTooltips(): void {
    const menus = this.routes.visible;
    this.setTitleAttributes(menus);
  }

  private setTitleAttributes(menus: any[]): void {
    for (const menu of menus) {
      const title = this.localizationService.instant(menu.name);
      const anchor = document.querySelector(`a[href='${menu.path}']`);

      if (anchor && title) {
        anchor.setAttribute('title', title);
      }

      if (menu.children?.length) {
        this.setTitleAttributes(menu.children);
      }
    }
  }

  ngOnDestroy() {
    this.timerDestroy$.next();
    this.timerDestroy$.complete();

    this.destroy$.next();
    this.destroy$.complete();
  }
}
