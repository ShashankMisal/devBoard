import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.open(message, 'success');
  }

  error(message: string): void {
    this.open(message, 'error');
  }

  info(message: string): void {
    this.open(message, 'info');
  }

  private open(message: string, panelClass: 'success' | 'error' | 'info'): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 4500,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: [`app-snackbar-${panelClass}`],
    });
  }
}
