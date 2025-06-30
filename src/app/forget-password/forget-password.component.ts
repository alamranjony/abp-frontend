import { ToasterService } from '@abp/ng.theme.shared';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExtendedAccountService } from '@proxy/account';
import {
  ResetPasswordDto,
  SendPasswordResetCodeDto,
  VerifyPasswordResetTokenInput,
} from '@proxy/volo/abp/account';
import { PassWordResetAppName, VALID_EMAIL_REGEX } from '../shared/constants';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-forget-password',
  templateUrl: './forget-password.component.html',
  styleUrls: ['./forget-password.component.scss'],
})
export class ForgetPasswordComponent implements OnInit, OnDestroy {
  resetPasswordForm: FormGroup;
  showConfirmPasswordForm: boolean = false;
  isResetPasswordSuccess: boolean = false;

  email: string;
  userId: string;
  tenant: string;
  resetToken: string;
  isResetTokenVerified: boolean = false;

  destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private accountService: ExtendedAccountService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private toasterService: ToasterService,
  ) {}

  buildForm() {
    this.resetPasswordForm = this.fb.group(
      {
        password: ['', [Validators.required]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  ngOnInit(): void {
    this.userId = this.activatedRoute.snapshot.queryParams['userId'];
    this.tenant = this.activatedRoute.snapshot.queryParams['tenant'];
    this.resetToken = this.activatedRoute.snapshot.queryParams['resetToken'];
    this.showConfirmPasswordForm = !!this.userId && !!this.resetToken;

    if (this.showConfirmPasswordForm) {
      this.buildForm();
      this.verifyResetToken();
    }

    this.hideSideBar();
  }

  hideSideBar() {
    const elements = [
      { selector: '.lpx-sidebar-container', className: 'd-none' },
      { selector: '.lpx-content-container', className: 'ms-0' },
      { selector: '.lpx-breadcrumb-item-icon', className: 'd-none' },
      { selector: '.lpx-breadcrumb-item-text', className: 'd-none' },
    ];

    elements.forEach(({ selector, className }) => {
      const element = document.querySelector(selector);
      if (element) {
        element.classList.add(className);
      }
    });
  }

  verifyResetToken() {
    let verifyPasswordResetTokenInput: VerifyPasswordResetTokenInput = {
      userId: this.userId,
      resetToken: this.resetToken,
    };

    this.accountService
      .verifyPasswordResetToken(verifyPasswordResetTokenInput)
      .pipe(takeUntil(this.destroy$))
      .subscribe((isVerified: boolean) => {
        this.isResetTokenVerified = isVerified;
        if (!this.isResetTokenVerified) {
          this.toasterService.error('::ForgetPassword:UserVerificationFailed');
          this.router.navigate(['/']);
        }
      });
  }

  passwordMatchValidator(control: AbstractControl) {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    return password?.value === confirmPassword?.value ? null : { passwordMisMatch: true };
  }

  onSubmit() {
    if (this.resetPasswordForm.invalid) {
      this.toasterService.error('::ValidationError:InvalidFormOrData');
      return;
    }

    if (!this.isResetTokenVerified) {
      this.toasterService.error('::ForgetPassword:UserVerificationFailed');
      return;
    }

    let resetPasswordDto: ResetPasswordDto = {
      userId: this.userId,
      resetToken: this.resetToken,
      password: this.resetPasswordForm.controls.confirmPassword.value,
    };

    this.accountService
      .resetPassword(resetPasswordDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.showConfirmPasswordForm = false;
        this.isResetPasswordSuccess = true;
      });
  }

  sendVerificationLink() {
    if (!VALID_EMAIL_REGEX.test(this.email)) {
      this.toasterService.error('::Error:InvalidEmail');
      return;
    }

    let sendPasswordResetCodeDto: SendPasswordResetCodeDto = {
      email: this.email,
      appName: PassWordResetAppName,
    };

    this.accountService
      .sendPasswordResetCode(sendPasswordResetCodeDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toasterService.success('::ForgetPassword:VerificationLinkSentSuccessMessage');
          this.router.navigate(['/']);
        },
        error: () => {
          this.toasterService.error('::ForgetPassword:VerificationLinkSentFailedMessage');
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
