import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

import { SessionService } from '../auth/session.service';
import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';

describe('auth guards', () => {
  let isAuthenticated = false;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: SessionService,
          useValue: {
            isAuthenticated: () => isAuthenticated,
            isBootstrapping: signal(false),
          },
        },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('redirects unauthenticated users from protected routes to login', () => {
    isAuthenticated = false;

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/projects' } as RouterStateSnapshot),
    );

    expect(result).toEqual(router.createUrlTree(['/login'], { queryParams: { returnUrl: '/projects' } }));
  });

  it('allows authenticated users through protected routes', () => {
    isAuthenticated = true;

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/projects' } as RouterStateSnapshot),
    );

    expect(result).toBeTrue();
  });

  it('redirects authenticated users away from guest routes', () => {
    isAuthenticated = true;

    const result = TestBed.runInInjectionContext(() =>
      guestGuard({} as ActivatedRouteSnapshot, { url: '/login' } as RouterStateSnapshot),
    );

    expect(result).toEqual(router.createUrlTree(['/dashboard']));
  });
});
