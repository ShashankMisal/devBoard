import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AppApiError } from '../../../core/api/api.models';
import { SessionService } from '../../../core/auth/session.service';
import { NotificationService } from '../../../core/services/notification.service';
import { applyApiFieldErrors, getControlError } from '../../../shared/utils/form-errors';

@Component({
  selector: 'app-login-page',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrl: '../auth-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notificationService = inject(NotificationService);

  readonly isSubmitting = signal(false);
  readonly formError = signal('');
  readonly form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  getError(controlName: string): string {
    return getControlError(this.form, controlName);
  }

  submit(): void {
    this.formError.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.session
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.notificationService.success('Logged in successfully.');
          void this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard');
        },
        error: (error: AppApiError) => {
          if (!applyApiFieldErrors(this.form, error)) {
            this.formError.set(error.message);
          }
        },
      });
  }
}
