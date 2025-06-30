import { AbstractControl, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';

export class PasswordStateMatcher implements ErrorStateMatcher {
  constructor(private errorCode: string) {}
  isErrorState(control: AbstractControl<any, any>, form: FormGroupDirective | NgForm): boolean {
    return control.touched && (control.invalid || form.hasError(this.errorCode));
  }
}
