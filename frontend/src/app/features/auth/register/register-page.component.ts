import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AppApiError } from '../../../core/api/api.models';
import { SessionService } from '../../../core/auth/session.service';
import { NotificationService } from '../../../core/services/notification.service';
import { applyApiFieldErrors, getControlError } from '../../../shared/utils/form-errors';

const passwordPolicy = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

@Component({
  selector: 'app-register-page',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register-page.component.html',
  styleUrl: '../auth-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPageComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  readonly isSubmitting = signal(false);
  readonly isPasswordVisible = signal(false);
  readonly formError = signal('');
  readonly form = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.pattern(passwordPolicy)]],
  });

  getError(controlName: string): string {
    return getControlError(this.form, controlName);
  }

  togglePasswordVisibility(): void {
    this.isPasswordVisible.update((isVisible) => !isVisible);
  }

  submit(): void {
    this.formError.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.session
      .register(this.form.getRawValue())
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.notificationService.success('Account created successfully.');
          void this.router.navigateByUrl('/dashboard');
        },
        error: (error: AppApiError) => {
          if (!applyApiFieldErrors(this.form, error)) {
            this.formError.set(error.message);
          }
        },
      });
  }
}
