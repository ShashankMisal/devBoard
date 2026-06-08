import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AppApiError } from '../../../core/api/api.models';
import { DashboardSummary } from '../models/dashboard.models';
import { DashboardApiService } from './dashboard-api.service';
import { DashboardStateService } from './dashboard-state.service';

const summary: DashboardSummary = {
  projectCounts: { total: 1, active: 1, archived: 0 },
  taskCounts: { assigned: 0, todo: 0, inProgress: 0, done: 0 },
  recentProjects: [
    {
      _id: 'project-1',
      title: 'Frontend Platform',
      description: 'Angular workspace',
      owner: { _id: 'owner-1', name: 'Owner User', email: 'owner@example.com', role: 'user' },
      members: [],
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    },
  ],
  upcomingAssignedTasks: [],
};

describe('DashboardStateService', () => {
  let dashboardApi: jasmine.SpyObj<DashboardApiService>;
  let service: DashboardStateService;

  beforeEach(() => {
    dashboardApi = jasmine.createSpyObj<DashboardApiService>('DashboardApiService', ['getSummary']);

    TestBed.configureTestingModule({
      providers: [DashboardStateService, { provide: DashboardApiService, useValue: dashboardApi }],
    });

    service = TestBed.inject(DashboardStateService);
  });

  it('stores loaded dashboard summary', () => {
    dashboardApi.getSummary.and.returnValue(of(summary));

    service.loadSummary();

    expect(service.summary()).toEqual(summary);
    expect(service.hasProjects()).toBeTrue();
    expect(service.hasUpcomingTasks()).toBeFalse();
    expect(service.isLoading()).toBeFalse();
  });

  it('stores dashboard load errors', () => {
    const error: AppApiError = { message: 'Dashboard failed.', kind: 'server', fields: {} };
    dashboardApi.getSummary.and.returnValue(throwError(() => error));

    service.loadSummary();

    expect(service.error()).toBe('Dashboard failed.');
    expect(service.isLoading()).toBeFalse();
  });
});
