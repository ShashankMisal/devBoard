import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { DashboardSummary } from './models/dashboard.models';
import { DashboardPageComponent } from './dashboard-page.component';
import { DashboardStateService } from './services/dashboard-state.service';

const summary: DashboardSummary = {
  projectCounts: { total: 2, active: 1, archived: 1 },
  taskCounts: { assigned: 3, todo: 1, inProgress: 1, done: 1 },
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
  upcomingAssignedTasks: [
    {
      _id: 'task-1',
      title: 'Ship dashboard',
      description: '',
      project: {
        _id: 'project-1',
        title: 'Frontend Platform',
        status: 'active',
        owner: { _id: 'owner-1', name: 'Owner User', email: 'owner@example.com', role: 'user' },
        members: [],
      },
      assignee: { _id: 'owner-1', name: 'Owner User', email: 'owner@example.com', role: 'user' },
      createdBy: { _id: 'owner-1', name: 'Owner User', email: 'owner@example.com', role: 'user' },
      status: 'in-progress',
      priority: 'high',
      dueDate: '2026-06-09T00:00:00.000Z',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    },
  ],
};

describe('DashboardPageComponent', () => {
  let fixture: ComponentFixture<DashboardPageComponent>;
  let state: {
    summary: ReturnType<typeof signal<DashboardSummary | null>>;
    isLoading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string>>;
    loadSummary: jasmine.Spy;
  };

  beforeEach(async () => {
    state = {
      summary: signal<DashboardSummary | null>(summary),
      isLoading: signal(false),
      error: signal(''),
      loadSummary: jasmine.createSpy('loadSummary'),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [provideNoopAnimations(), provideRouter([]), { provide: DashboardStateService, useValue: state }],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();
  });

  it('loads and renders dashboard summary', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(state.loadSummary).toHaveBeenCalled();
    expect(text).toContain('Total projects');
    expect(text).toContain('2');
    expect(text).toContain('Frontend Platform');
    expect(text).toContain('Ship dashboard');
    expect(text).toContain('In progress');
  });

  it('renders empty dashboard lists', () => {
    state.summary.set({
      projectCounts: { total: 0, active: 0, archived: 0 },
      taskCounts: { assigned: 0, todo: 0, inProgress: 0, done: 0 },
      recentProjects: [],
      upcomingAssignedTasks: [],
    });
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('No projects yet');
    expect(text).toContain('No upcoming assigned tasks');
  });

  it('renders a retryable error state', () => {
    state.error.set('Dashboard failed.');
    state.summary.set(null);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(fixture.nativeElement.textContent).toContain('Dashboard could not load');
    button.click();
    expect(state.loadSummary).toHaveBeenCalledTimes(2);
  });
});
