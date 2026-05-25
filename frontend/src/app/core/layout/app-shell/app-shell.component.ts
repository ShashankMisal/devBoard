import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { SessionService } from '../../auth/session.service';
import { LoadingService } from '../../services/loading.service';
import { ThemeMode, ThemeService } from '../../services/theme.service';

interface NavItem {
  label: string;
  path: string;
}

@Component({
  selector: 'app-shell',
  imports: [MatButtonModule, MatDialogModule, MatProgressBarModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  private readonly themeService = inject(ThemeService);
  private readonly loadingService = inject(LoadingService);
  private readonly session = inject(SessionService);
  private readonly dialog = inject(MatDialog);

  readonly isLoading = this.loadingService.isLoading;
  readonly themeMode = this.themeService.mode;
  readonly isAuthenticated = this.session.isAuthenticated;
  readonly user = this.session.user;

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Projects', path: '/projects' },
    { label: 'Tasks', path: '/tasks' },
  ];

  setThemeMode(mode: ThemeMode): void {
    this.themeService.setMode(mode);
  }

  confirmLogout(): void {
    const dialogRef = this.dialog.open(LogoutDialogComponent, {
      width: 'min(420px, calc(100vw - 32px))',
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.session.logout().subscribe();
      }
    });
  }
}

@Component({
  selector: 'app-logout-dialog',
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Log out?</h2>
    <mat-dialog-content>You will need to log in again to access your DevBoard workspace.</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="dialogRef.close(false)">Cancel</button>
      <button mat-flat-button type="button" (click)="dialogRef.close(true)">Logout</button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoutDialogComponent {
  readonly dialogRef = inject(MatDialogRef<LogoutDialogComponent, boolean>);
}
