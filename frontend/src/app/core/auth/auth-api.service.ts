import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from '../api/api-client.service';
import { AuthPayload, LoginRequest, RefreshTokenPayload, RegisterRequest, UpdateProfileRequest, User } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly apiClient = inject(ApiClient);

  register(payload: RegisterRequest): Observable<AuthPayload> {
    return this.apiClient.post<AuthPayload, RegisterRequest>('/auth/register', payload);
  }

  login(payload: LoginRequest): Observable<AuthPayload> {
    return this.apiClient.post<AuthPayload, LoginRequest>('/auth/login', payload);
  }

  logout(): Observable<null> {
    return this.apiClient.post<null, Record<string, never>>('/auth/logout', {});
  }

  refreshToken(): Observable<RefreshTokenPayload> {
    return this.apiClient.post<RefreshTokenPayload, Record<string, never>>('/auth/refresh-token', {});
  }

  getMe(): Observable<User> {
    return this.apiClient.get<User>('/users/me');
  }

  updateMe(payload: UpdateProfileRequest): Observable<User> {
    return this.apiClient.put<User, UpdateProfileRequest>('/users/me', payload);
  }

  deactivateMe(): Observable<User> {
    return this.apiClient.delete<User>('/users/me');
  }
}
