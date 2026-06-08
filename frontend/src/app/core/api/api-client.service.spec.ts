import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { API_BASE_URL } from '../tokens/api-base-url.token';
import { ApiClient, isRetryableGetFailure, normalizeApiError } from './api-client.service';

describe('ApiClient', () => {
  let apiClient: ApiClient;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: '/api/v1' }],
    });

    apiClient = TestBed.inject(ApiClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('unwraps successful API response data', () => {
    let result: { ok: boolean } | undefined;

    apiClient.get<{ ok: boolean }>('/health').subscribe((value) => {
      result = value;
    });

    const request = httpTestingController.expectOne('/api/v1/health');
    request.flush({ statusCode: 200, message: 'ok', data: { ok: true }, success: true });

    expect(result).toEqual({ ok: true });
  });

  it('normalizes backend validation errors', () => {
    const error = normalizeApiError(
      new HttpErrorResponse({
        status: 400,
        error: {
          success: false,
          message: 'Validation failed.',
          errors: [{ field: 'email', message: 'Email is invalid.' }],
        },
      }),
    );

    expect(error).toEqual({
      message: 'Validation failed.',
      status: 400,
      kind: 'validation',
      fields: { email: 'Email is invalid.' },
    });
  });

  it('retries transient GET failures and then succeeds', fakeAsync(() => {
    let result: { ok: boolean } | undefined;

    apiClient.get<{ ok: boolean }>('/projects').subscribe((value) => {
      result = value;
    });

    httpTestingController.expectOne('/api/v1/projects').flush({}, { status: 503, statusText: 'Unavailable' });
    tick(250);
    httpTestingController.expectOne('/api/v1/projects').flush({}, { status: 503, statusText: 'Unavailable' });
    tick(500);
    httpTestingController
      .expectOne('/api/v1/projects')
      .flush({ statusCode: 200, message: 'ok', data: { ok: true }, success: true });

    expect(result).toEqual({ ok: true });
  }));

  it('does not retry writes', () => {
    let errorMessage = '';

    apiClient.post('/projects', { title: 'New' }).subscribe({
      error: (error) => {
        errorMessage = error.message;
      },
    });

    httpTestingController.expectOne('/api/v1/projects').flush({}, { status: 503, statusText: 'Unavailable' });

    expect(errorMessage).toBe('Server error. Try again in a moment.');
  });

  it('identifies only transient HTTP failures as retryable', () => {
    expect(isRetryableGetFailure(new HttpErrorResponse({ status: 0 }))).toBeTrue();
    expect(isRetryableGetFailure(new HttpErrorResponse({ status: 504 }))).toBeTrue();
    expect(isRetryableGetFailure(new HttpErrorResponse({ status: 401 }))).toBeFalse();
    expect(isRetryableGetFailure({ status: 503 })).toBeFalse();
  });
});
