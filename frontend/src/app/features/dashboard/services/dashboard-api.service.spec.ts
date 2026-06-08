import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ApiClient } from '../../../core/api/api-client.service';
import { DashboardSummary } from '../models/dashboard.models';
import { DashboardApiService } from './dashboard-api.service';

const summary: DashboardSummary = {
  projectCounts: { total: 0, active: 0, archived: 0 },
  taskCounts: { assigned: 0, todo: 0, inProgress: 0, done: 0 },
  recentProjects: [],
  upcomingAssignedTasks: [],
};

describe('DashboardApiService', () => {
  let apiClient: jasmine.SpyObj<ApiClient>;
  let service: DashboardApiService;

  beforeEach(() => {
    apiClient = jasmine.createSpyObj<ApiClient>('ApiClient', ['get']);

    TestBed.configureTestingModule({
      providers: [DashboardApiService, { provide: ApiClient, useValue: apiClient }],
    });

    service = TestBed.inject(DashboardApiService);
  });

  it('requests the dashboard summary endpoint', () => {
    apiClient.get.and.returnValue(of(summary));

    service.getSummary().subscribe();

    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/summary');
  });
});
