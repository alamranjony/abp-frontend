import { AuthService, ConfigStateService, CurrentUserDto, LocalizationService } from '@abp/ng.core';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterModule } from '@angular/router';
import { IdentitySessionService } from '@proxy/identity-sessions';
import { concatMap, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-user-profile-menu',
  templateUrl: './user-profile-menu.component.html',
  styleUrls: ['./user-profile-menu.component.scss'],
  standalone: true,
  imports: [MatButtonModule, MatMenuModule, RouterModule],
})
export class UserProfileMenuComponent implements OnInit, OnDestroy {
  destroy$: Subject<void> = new Subject();
  myAccountMenuTitle: string;
  logoutMenuTitle: string;
  currentUser: CurrentUserDto;

  constructor(
    private authService: AuthService,
    private router: Router,
    private identitySessionService: IdentitySessionService,
    private configState: ConfigStateService,
    private localizationService: LocalizationService,
  ) {}

  ngOnInit() {
    this.myAccountMenuTitle = this.localizationService.instant('::UserProfileMenu:MyAccount');
    this.logoutMenuTitle = this.localizationService.instant('::UserProfileMenu:Logout');
    this.currentUser = this.configState.getOne('currentUser') as CurrentUserDto;
  }

  logOut() {
    if (!this.currentUser?.id) {
      return;
    }

    this.identitySessionService
      .resetUserSession(this.currentUser.id)
      .pipe(concatMap(() => this.authService.logout()))
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.router.navigate(['/']);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
