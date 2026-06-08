import { computed, Injectable, inject, signal } from '@angular/core';

import { AppApiError } from '../../../core/api/api.models';
import { DashboardSummary } from '../models/dashboard.models';
import { DashboardApiService } from './dashboard-api.service';

@Injectable({ providedIn: 'root' })
export class DashboardStateService {
  private readonly dashboardApi = inject(DashboardApiService);
  private readonly summarySignal = signal<DashboardSummary | null>(null);
  private readonly isLoadingSignal = signal(false);
  private readonly errorSignal = signal('');

  readonly summary = this.summarySignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly hasProjects = computed(() => (this.summarySignal()?.projectCounts.total ?? 0) > 0);
  readonly hasUpcomingTasks = computed(() => (this.summarySignal()?.upcomingAssignedTasks.length ?? 0) > 0);

  loadSummary(): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set('');

    this.dashboardApi.getSummary().subscribe({
      next: (summary) => {
        this.summarySignal.set(summary);
        this.isLoadingSignal.set(false);
      },
      error: (error: AppApiError) => {
        this.errorSignal.set(error.message);
        this.isLoadingSignal.set(false);
      },
    });
  }
}
