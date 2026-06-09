import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let mediaQuery: MediaQueryList;
  let mediaQueryListener: ((event: MediaQueryListEvent) => void) | undefined;

  function configureMatchMedia(matches: boolean): void {
    mediaQueryListener = undefined;
    mediaQuery = {
      matches,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addEventListener: jasmine
        .createSpy('addEventListener')
        .and.callFake((_type: string, listener: (event: MediaQueryListEvent) => void) => {
          mediaQueryListener = listener;
        }),
      removeEventListener: jasmine.createSpy('removeEventListener'),
      addListener: jasmine.createSpy('addListener'),
      removeListener: jasmine.createSpy('removeListener'),
      dispatchEvent: jasmine.createSpy('dispatchEvent').and.returnValue(false),
    } as unknown as MediaQueryList;

    spyOn(window, 'matchMedia').and.returnValue(mediaQuery);
  }

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-theme-mode');
    document.documentElement.style.colorScheme = '';
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-theme-mode');
    document.documentElement.style.colorScheme = '';
  });

  it('defaults to system mode and applies the current system theme', () => {
    configureMatchMedia(false);

    const service = TestBed.inject(ThemeService);
    TestBed.flushEffects();

    expect(service.mode()).toBe('system');
    expect(service.resolvedTheme()).toBe('light');
    expect(document.documentElement.dataset['theme']).toBe('light');
    expect(document.documentElement.dataset['themeMode']).toBe('system');
    expect(document.documentElement.style.colorScheme).toBe('light');
    expect(localStorage.getItem('devboard.theme')).toBe('system');
  });

  it('restores a stored explicit theme mode', () => {
    localStorage.setItem('devboard.theme', 'dark');
    configureMatchMedia(false);

    const service = TestBed.inject(ThemeService);
    TestBed.flushEffects();

    expect(service.mode()).toBe('dark');
    expect(service.resolvedTheme()).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(document.documentElement.dataset['themeMode']).toBe('dark');
  });

  it('persists explicit mode changes and toggles against the resolved theme', () => {
    configureMatchMedia(true);

    const service = TestBed.inject(ThemeService);
    TestBed.flushEffects();

    service.setMode('light');
    TestBed.flushEffects();

    expect(service.mode()).toBe('light');
    expect(service.resolvedTheme()).toBe('light');
    expect(localStorage.getItem('devboard.theme')).toBe('light');

    service.toggleResolvedTheme();
    TestBed.flushEffects();

    expect(service.mode()).toBe('dark');
    expect(service.resolvedTheme()).toBe('dark');
    expect(localStorage.getItem('devboard.theme')).toBe('dark');
  });

  it('updates the resolved theme when the system preference changes in system mode', () => {
    configureMatchMedia(false);

    const service = TestBed.inject(ThemeService);
    TestBed.flushEffects();

    mediaQueryListener?.({ matches: true } as MediaQueryListEvent);
    TestBed.flushEffects();

    expect(service.mode()).toBe('system');
    expect(service.resolvedTheme()).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });
});
