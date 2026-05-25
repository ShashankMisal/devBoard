import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'devboard.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly mediaQuery = this.getMediaQuery();
  private readonly systemTheme = signal<ResolvedTheme>(this.getSystemTheme());

  readonly mode = signal<ThemeMode>(this.getStoredMode());
  readonly resolvedTheme = computed<ResolvedTheme>(() => {
    const mode = this.mode();

    return mode === 'system' ? this.systemTheme() : mode;
  });

  constructor() {
    this.mediaQuery?.addEventListener('change', this.handleSystemThemeChange);

    effect(() => {
      const mode = this.mode();
      const resolvedTheme = this.resolvedTheme();
      const root = this.document.documentElement;

      root.dataset['theme'] = resolvedTheme;
      root.dataset['themeMode'] = mode;
      root.style.colorScheme = resolvedTheme;
      localStorage.setItem(STORAGE_KEY, mode);
    });
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
  }

  toggleResolvedTheme(): void {
    this.setMode(this.resolvedTheme() === 'dark' ? 'light' : 'dark');
  }

  private readonly handleSystemThemeChange = (event: MediaQueryListEvent): void => {
    this.systemTheme.set(event.matches ? 'dark' : 'light');
  };

  private getStoredMode(): ThemeMode {
    const storedMode = localStorage.getItem(STORAGE_KEY);

    return storedMode === 'light' || storedMode === 'dark' || storedMode === 'system' ? storedMode : 'system';
  }

  private getSystemTheme(): ResolvedTheme {
    return this.mediaQuery?.matches ? 'dark' : 'light';
  }

  private getMediaQuery(): MediaQueryList | null {
    return typeof window === 'undefined' ? null : window.matchMedia('(prefers-color-scheme: dark)');
  }
}
