import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { SessionService } from '../auth/session.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpTestingController: HttpTestingController;
  let accessToken: ReturnType<typeof signal<string | null>>;
  let session: jasmine.SpyObj<Pick<SessionService, 'refreshAccessToken' | 'clearSessionAndRedirectToLogin'>> & {
    accessToken: ReturnType<typeof signal<string | null>>;
  };

  beforeEach(() => {
    accessToken = signal<string | null>('access-token');
    session = jasmine.createSpyObj('SessionService', ['refreshAccessToken', 'clearSessionAndRedirectToLogin'], {
      accessToken,
    });

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: SessionService, useValue: session },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('adds the bearer token when one exists', () => {
    http.get('/api/v1/users/me').subscribe();

    const request = httpTestingController.expectOne('/api/v1/users/me');
    expect(request.request.headers.get('Authorization')).toBe('Bearer access-token');
    request.flush({});
  });

  it('refreshes once on 401 and retries the original request', () => {
    session.refreshAccessToken.and.returnValue(of('fresh-token'));

    http.get('/api/v1/projects').subscribe();

    const originalRequest = httpTestingController.expectOne('/api/v1/projects');
    originalRequest.flush({}, { status: 401, statusText: 'Unauthorized' });

    const retriedRequest = httpTestingController.expectOne('/api/v1/projects');
    expect(retriedRequest.request.headers.get('Authorization')).toBe('Bearer fresh-token');
    retriedRequest.flush({});

    expect(session.refreshAccessToken).toHaveBeenCalledTimes(1);
  });

  it('clears session and redirects when refresh fails', () => {
    session.refreshAccessToken.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' })),
    );

    http.get('/api/v1/projects').subscribe({ error: () => undefined });

    const originalRequest = httpTestingController.expectOne('/api/v1/projects');
    originalRequest.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(session.clearSessionAndRedirectToLogin).toHaveBeenCalled();
  });

  it('does not refresh auth endpoint failures', () => {
    http.post('/api/v1/auth/login', {}).subscribe({ error: () => undefined });

    const request = httpTestingController.expectOne('/api/v1/auth/login');
    request.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(session.refreshAccessToken).not.toHaveBeenCalled();
  });
});
