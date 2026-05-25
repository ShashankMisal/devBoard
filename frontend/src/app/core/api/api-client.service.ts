import { HttpClient, HttpErrorResponse, HttpParams, HttpParamsOptions } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

import { API_BASE_URL } from '../tokens/api-base-url.token';
import { ApiErrorResponse, ApiResponse, AppApiError } from './api.models';

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
    return this.http
      .get<ApiResponse<T>>(this.toUrl(path), this.toHttpOptions(options))
      .pipe(map((response) => response.data), catchError((error) => this.normalizeError(error)));
  }

  post<T, Body = unknown>(path: string, body: Body, options?: ApiRequestOptions): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(this.toUrl(path), body, this.toHttpOptions(options))
      .pipe(map((response) => response.data), catchError((error) => this.normalizeError(error)));
  }

  put<T, Body = unknown>(path: string, body: Body, options?: ApiRequestOptions): Observable<T> {
    return this.http
      .put<ApiResponse<T>>(this.toUrl(path), body, this.toHttpOptions(options))
      .pipe(map((response) => response.data), catchError((error) => this.normalizeError(error)));
  }

  delete<T>(path: string, options?: ApiRequestOptions): Observable<T> {
    return this.http
      .delete<ApiResponse<T>>(this.toUrl(path), this.toHttpOptions(options))
      .pipe(map((response) => response.data), catchError((error) => this.normalizeError(error)));
  }

  private toUrl(path: string): string {
    const normalizedBase = this.baseUrl.replace(/\/$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    return `${normalizedBase}${normalizedPath}`;
  }

  private toHttpOptions(options?: ApiRequestOptions): { params?: HttpParams; withCredentials: boolean } {
    return {
      params: options?.params instanceof HttpParams ? options.params : new HttpParams({ fromObject: options?.params ?? {} }),
      withCredentials: options?.withCredentials ?? true,
    };
  }

  private normalizeError(error: unknown): Observable<never> {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as Partial<ApiErrorResponse> | null;
      const fields = (body?.errors ?? []).reduce<Record<string, string>>((accumulator, fieldError) => {
        if (fieldError.field) {
          accumulator[fieldError.field] = fieldError.message;
        }

        return accumulator;
      }, {});
      const appError: AppApiError = {
        message: body?.message || error.message || 'Request failed.',
        status: error.status || undefined,
        fields,
      };

      return throwError(() => appError);
    }

    return throwError(() => ({
      message: 'Unexpected application error.',
      fields: {},
    }) satisfies AppApiError);
  }
}
