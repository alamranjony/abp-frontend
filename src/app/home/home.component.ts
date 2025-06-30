import { AuthService } from '@abp/ng.core';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TimeClockComponent } from '../time-clock/time-clock.component';
import { NavItemsService } from '@abp/ng.theme.shared';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  get hasLoggedIn(): boolean {
    if (!this.authService.isAuthenticated) {
      const elements = [
        { selector: '.lpx-sidebar-container', style: 'display: none;' },
        { selector: '.lpx-content-container', style: 'margin-left: 0;' },
        { selector: '.lpx-breadcrumb-item-icon', style: 'display: none;' },
        { selector: '.lpx-breadcrumb-item-text', style: 'display: none;' },
      ];

      elements.forEach(({ selector, style }) => {
        const element = document.querySelector(selector);
        if (element) {
          element.setAttribute('style', style);
        }
      });
    }
    return this.authService.isAuthenticated;
  }

  constructor(
    private readonly authService: AuthService,
    private readonly dialog: MatDialog,
    private readonly navItems: NavItemsService,
  ) {
    navItems.removeItem('Theme.LoginComponent');
  }

  openModal() {
    this.dialog.open(TimeClockComponent, {
      width: '600px',
    });
  }
}
