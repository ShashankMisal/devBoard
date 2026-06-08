import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from '../../../core/api/api-client.service';
import { DashboardSummary } from '../models/dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly apiClient = inject(ApiClient);

  getSummary(): Observable<DashboardSummary> {
    return this.apiClient.get<DashboardSummary>('/dashboard/summary');
  }
}
