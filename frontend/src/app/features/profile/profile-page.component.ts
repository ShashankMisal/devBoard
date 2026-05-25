import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AppApiError } from '../../core/api/api.models';
import { SessionService } from '../../core/auth/session.service';
import { NotificationService } from '../../core/services/notification.service';
import { applyApiFieldErrors, getControlError } from '../../shared/utils/form-errors';

@Component({
  selector: 'app-deactivate-account-dialog',
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Deactivate account?</h2>
    <mat-dialog-content>
      This will deactivate your account and end your current session. This action should only be used when you no longer
      need access to DevBoard.
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="dialogRef.close(false)">Cancel</button>
      <button mat-flat-button color="warn" type="button" (click)="dialogRef.close(true)">Deactivate</button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeactivateAccountDialogComponent {
  readonly dialogRef = inject(MatDialogRef<DeactivateAccountDialogComponent, boolean>);
}

@Component({
  selector: 'app-profile-page',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePageComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly session = inject(SessionService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  readonly user = this.session.user;
  readonly isSubmitting = signal(false);
  readonly isDeactivating = signal(false);
  readonly formError = signal('');
  readonly form = this.formBuilder.group({
    name: [this.user()?.name ?? '', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    email: [this.user()?.email ?? '', [Validators.required, Validators.email]],
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
      .updateProfile(this.form.getRawValue())
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.notificationService.success('Profile updated successfully.');
        },
        error: (error: AppApiError) => {
          if (!applyApiFieldErrors(this.form, error)) {
            this.formError.set(error.message);
          }
        },
      });
  }

  confirmDeactivate(): void {
    const dialogRef = this.dialog.open(DeactivateAccountDialogComponent, {
      width: 'min(420px, calc(100vw - 32px))',
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.deactivateAccount();
      }
    });
  }

  private deactivateAccount(): void {
    this.isDeactivating.set(true);
    this.session
      .deactivateAccount()
      .pipe(finalize(() => this.isDeactivating.set(false)))
      .subscribe({
        next: () => {
          this.notificationService.success('Account deactivated.');
          void this.router.navigateByUrl('/login');
        },
        error: (error: AppApiError) => {
          this.notificationService.error(error.message);
        },
      });
  }
}
