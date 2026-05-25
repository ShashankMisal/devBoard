import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { LoadingService } from '../../services/loading.service';
import { ThemeMode, ThemeService } from '../../services/theme.service';

interface NavItem {
  label: string;
  path: string;
}

@Component({
  selector: 'app-shell',
  imports: [MatButtonModule, MatProgressBarModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  private readonly themeService = inject(ThemeService);
  private readonly loadingService = inject(LoadingService);

  readonly isLoading = this.loadingService.isLoading;
  readonly themeMode = this.themeService.mode;

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Projects', path: '/projects' },
    { label: 'Tasks', path: '/tasks' },
  ];

  setThemeMode(mode: ThemeMode): void {
    this.themeService.setMode(mode);
  }
}
