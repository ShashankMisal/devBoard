import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, Observable, shareReplay, switchMap, throwError } from 'rxjs';

import { SessionService } from '../auth/session.service';

let refreshRequest$: Observable<string> | null = null;

const excludedAuthPaths = ['/auth/login', '/auth/register', '/auth/logout', '/auth/refresh-token'];

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SessionService);
  const authRequest = attachAccessToken(request, session.accessToken());

  return next(authRequest).pipe(
    catchError((error: unknown) => {
      if (!shouldAttemptRefresh(error, request)) {
        return throwError(() => error);
      }

      refreshRequest$ ??= session.refreshAccessToken().pipe(
        shareReplay({ bufferSize: 1, refCount: false }),
        finalize(() => {
          refreshRequest$ = null;
        }),
      );

      return refreshRequest$.pipe(
        switchMap((accessToken) => next(attachAccessToken(request, accessToken))),
        catchError((refreshError: unknown) => {
          session.clearSessionAndRedirectToLogin();

          return throwError(() => refreshError);
        }),
      );
    }),
  );
};

function attachAccessToken(request: HttpRequest<unknown>, accessToken: string | null): HttpRequest<unknown> {
  if (!accessToken || request.headers.has('Authorization')) {
    return request;
  }

  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

function shouldAttemptRefresh(error: unknown, request: HttpRequest<unknown>): error is HttpErrorResponse {
  if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
    return false;
  }

  return !excludedAuthPaths.some((path) => request.url.includes(path));
}
