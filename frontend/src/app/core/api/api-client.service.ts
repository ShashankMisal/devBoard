import { HttpClient, HttpErrorResponse, HttpParams, HttpParamsOptions } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, retry, throwError, timer } from 'rxjs';

import { API_BASE_URL } from '../tokens/api-base-url.token';
import { ApiErrorResponse, ApiResponse, AppApiError, AppApiErrorKind } from './api.models';

type QueryParams =
  | HttpParams
  | HttpParamsOptions['fromObject']
  | Record<string, string | number | boolean | readonly (string | number | boolean)[]>;

export interface ApiRequestOptions {
  params?: QueryParams;
  withCredentials?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  get<T>(path: string, options?: ApiRequestOptions): Observable<T> {
    return this.http.get<ApiResponse<T>>(this.toUrl(path), this.toHttpOptions(options)).pipe(
      retry({
        count: 2,
        delay: (error, retryCount) =>
          isRetryableGetFailure(error) ? timer(retryCount * 250) : throwError(() => error),
      }),
      map((response) => response.data),
      catchError((error) => throwError(() => normalizeApiError(error))),
    );
  }

  post<T, Body = unknown>(path: string, body: Body, options?: ApiRequestOptions): Observable<T> {
    return this.http.post<ApiResponse<T>>(this.toUrl(path), body, this.toHttpOptions(options)).pipe(
      map((response) => response.data),
      catchError((error) => throwError(() => normalizeApiError(error))),
    );
  }

  put<T, Body = unknown>(path: string, body: Body, options?: ApiRequestOptions): Observable<T> {
    return this.http.put<ApiResponse<T>>(this.toUrl(path), body, this.toHttpOptions(options)).pipe(
      map((response) => response.data),
      catchError((error) => throwError(() => normalizeApiError(error))),
    );
  }

  delete<T>(path: string, options?: ApiRequestOptions): Observable<T> {
    return this.http.delete<ApiResponse<T>>(this.toUrl(path), this.toHttpOptions(options)).pipe(
      map((response) => response.data),
      catchError((error) => throwError(() => normalizeApiError(error))),
    );
  }

  private toUrl(path: string): string {
    const normalizedBase = this.baseUrl.replace(/\/$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    return `${normalizedBase}${normalizedPath}`;
  }

  private toHttpOptions(options?: ApiRequestOptions): { params?: HttpParams; withCredentials: boolean } {
    return {
      params:
        options?.params instanceof HttpParams ? options.params : new HttpParams({ fromObject: options?.params ?? {} }),
      withCredentials: options?.withCredentials ?? true,
    };
  }
}

export function normalizeApiError(error: unknown): AppApiError {
  if (error instanceof HttpErrorResponse) {
    const body = isApiErrorBody(error.error) ? error.error : null;
    const fields = (body?.errors ?? []).reduce<Record<string, string>>((accumulator, fieldError) => {
      if (fieldError.field) {
        accumulator[fieldError.field] = fieldError.message;
      }

      return accumulator;
    }, {});

    return {
      message: body?.message || fallbackMessageForStatus(error.status),
      status: error.status || undefined,
      kind: kindForStatus(error.status, fields),
      fields,
    };
  }

  return {
    message: 'Unexpected application error.',
    kind: 'unknown',
    fields: {},
  };
}

export function isRetryableGetFailure(error: unknown): boolean {
  return error instanceof HttpErrorResponse && [0, 502, 503, 504].includes(error.status);
}

function isApiErrorBody(value: unknown): value is Partial<ApiErrorResponse> {
  return typeof value === 'object' && value !== null;
}

function fallbackMessageForStatus(status: number): string {
  if (status === 0) {
    return 'Network connection failed. Check your connection and try again.';
  }

  if (status >= 500) {
    return 'Server error. Try again in a moment.';
  }

  return 'Request failed.';
}

function kindForStatus(status: number, fields: Record<string, string>): AppApiErrorKind {
  if (status === 0) {
    return 'network';
  }

  if (Object.keys(fields).length > 0 || status === 400 || status === 422) {
    return 'validation';
  }

  if (status === 401) {
    return 'auth';
  }

  if (status === 403) {
    return 'forbidden';
  }

  if (status === 404) {
    return 'not-found';
  }

  if (status >= 500) {
    return 'server';
  }

  return 'unknown';
}
