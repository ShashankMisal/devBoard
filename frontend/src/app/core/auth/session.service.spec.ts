import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthApiService } from './auth-api.service';
import { AuthPayload, User } from './auth.models';
import { SessionService } from './session.service';

const user: User = {
  _id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const authPayload: AuthPayload = {
  user,
  accessToken: 'access-token',
};

describe('SessionService', () => {
  let authApi: jasmine.SpyObj<AuthApiService>;
  let router: jasmine.SpyObj<Router>;
  let service: SessionService;

  beforeEach(() => {
    authApi = jasmine.createSpyObj<AuthApiService>('AuthApiService', [
      'register',
      'login',
      'logout',
      'refreshToken',
      'getMe',
      'updateMe',
      'deactivateMe',
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);

    TestBed.configureTestingModule({
      providers: [
        SessionService,
        { provide: AuthApiService, useValue: authApi },
        { provide: Router, useValue: router },
      ],
    });

    service = TestBed.inject(SessionService);
  });

  it('sets the user and access token after login', () => {
    authApi.login.and.returnValue(of(authPayload));

    service.login({ email: 'test@example.com', password: 'Password1@' }).subscribe();

    expect(service.user()).toEqual(user);
    expect(service.accessToken()).toBe('access-token');
    expect(service.isAuthenticated()).toBeTrue();
  });

  it('sets the user and access token after register', () => {
    authApi.register.and.returnValue(of(authPayload));

    service.register({ name: 'Test User', email: 'test@example.com', password: 'Password1@' }).subscribe();

    expect(service.user()).toEqual(user);
    expect(service.accessToken()).toBe('access-token');
  });

  it('refreshes the access token without requiring a user payload', () => {
    authApi.refreshToken.and.returnValue(of({ accessToken: 'fresh-token' }));

    service.refreshAccessToken().subscribe((accessToken) => {
      expect(accessToken).toBe('fresh-token');
    });

    expect(service.accessToken()).toBe('fresh-token');
    expect(service.user()).toBeNull();
  });

  it('bootstraps by refreshing then loading the current user', async () => {
    authApi.refreshToken.and.returnValue(of({ accessToken: 'fresh-token' }));
    authApi.getMe.and.returnValue(of(user));

    await service.bootstrap();

    expect(service.accessToken()).toBe('fresh-token');
    expect(service.user()).toEqual(user);
    expect(service.isBootstrapping()).toBeFalse();
  });

  it('leaves guest state when bootstrap refresh fails', async () => {
    authApi.refreshToken.and.returnValue(throwError(() => new Error('missing cookie')));

    await service.bootstrap();

    expect(service.accessToken()).toBeNull();
    expect(service.user()).toBeNull();
    expect(service.isBootstrapping()).toBeFalse();
  });

  it('clears session after logout', () => {
    authApi.login.and.returnValue(of(authPayload));
    authApi.logout.and.returnValue(of(null));
    service.login({ email: 'test@example.com', password: 'Password1@' }).subscribe();

    service.logout().subscribe();

    expect(service.user()).toBeNull();
    expect(service.accessToken()).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('clears session after account deactivation', () => {
    authApi.login.and.returnValue(of(authPayload));
    authApi.deactivateMe.and.returnValue(of({ ...user, isActive: false }));
    service.login({ email: 'test@example.com', password: 'Password1@' }).subscribe();

    service.deactivateAccount().subscribe();

    expect(service.user()).toBeNull();
    expect(service.accessToken()).toBeNull();
  });
});
