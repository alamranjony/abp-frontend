import { Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { AbpOAuthService as AbpAuthService } from '@abp/ng.oauth';

@Injectable({
  providedIn: 'root',
})
export class CustomAuthService extends AbpAuthService {
  private router: Router;

  constructor(router: Router, injector: Injector) {
    super(injector);
    this.router = router;
  }

  override navigateToLogin(): void {
    this.router.navigate(['/']);
  }
}
