import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SessionService } from './core/auth/session.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly themeService = inject(ThemeService);
  private readonly session = inject(SessionService);

  readonly isBootstrapping = this.session.isBootstrapping;

  constructor() {
    this.themeService.resolvedTheme();
    void this.session.bootstrap();
  }
}
