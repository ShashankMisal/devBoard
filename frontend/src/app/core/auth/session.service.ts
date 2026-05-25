import { computed, Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, firstValueFrom, map, Observable, of, switchMap, tap } from 'rxjs';

import { AuthApiService } from './auth-api.service';
import { AuthPayload, LoginRequest, RegisterRequest, UpdateProfileRequest, User } from './auth.models';

export type AuthStatus = 'bootstrapping' | 'authenticated' | 'guest';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly userSignal = signal<User | null>(null);
  private readonly accessTokenSignal = signal<string | null>(null);
  private readonly bootstrappingSignal = signal(true);

  readonly user = this.userSignal.asReadonly();
  readonly accessToken = this.accessTokenSignal.asReadonly();
  readonly isBootstrapping = this.bootstrappingSignal.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this.accessTokenSignal() && this.userSignal()));
  readonly status = computed<AuthStatus>(() => {
    if (this.bootstrappingSignal()) {
      return 'bootstrapping';
    }

    return this.isAuthenticated() ? 'authenticated' : 'guest';
  });

  bootstrap(): Promise<void> {
    this.bootstrappingSignal.set(true);

    return firstValueFrom(
      this.refreshAccessToken().pipe(
        switchMap(() => this.loadCurrentUser()),
        map(() => undefined),
        catchError(() => {
          this.clearSession();

          return of(undefined);
        }),
        tap(() => this.bootstrappingSignal.set(false)),
      ),
    );
  }

  login(payload: LoginRequest): Observable<AuthPayload> {
    return this.authApi.login(payload).pipe(tap((authPayload) => this.setAuthPayload(authPayload)));
  }

  register(payload: RegisterRequest): Observable<AuthPayload> {
    return this.authApi.register(payload).pipe(tap((authPayload) => this.setAuthPayload(authPayload)));
  }

  logout(): Observable<void> {
    return this.authApi.logout().pipe(
      catchError(() => of(null)),
      tap(() => {
        this.clearSession();
        void this.router.navigateByUrl('/login');
      }),
      map(() => undefined),
    );
  }

  refreshAccessToken(): Observable<string> {
    return this.authApi.refreshToken().pipe(
      tap((payload) => this.accessTokenSignal.set(payload.accessToken)),
      map((payload) => payload.accessToken),
    );
  }

  loadCurrentUser(): Observable<User> {
    return this.authApi.getMe().pipe(tap((user) => this.userSignal.set(user)));
  }

  updateProfile(payload: UpdateProfileRequest): Observable<User> {
    return this.authApi.updateMe(payload).pipe(tap((user) => this.userSignal.set(user)));
  }

  deactivateAccount(): Observable<User> {
    return this.authApi.deactivateMe().pipe(tap(() => this.clearSession()));
  }

  clearSessionAndRedirectToLogin(): void {
    this.clearSession();
    void this.router.navigateByUrl('/login');
  }

  clearSession(): void {
    this.userSignal.set(null);
    this.accessTokenSignal.set(null);
  }

  private setAuthPayload(payload: AuthPayload): void {
    this.userSignal.set(payload.user);
    this.accessTokenSignal.set(payload.accessToken);
  }
}
