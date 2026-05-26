import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';

import { Project, ProjectsPage, ProjectsQuery } from './models/project.models';
import { ProjectsPageComponent } from './projects-page.component';
import { ProjectsStateService } from './services/projects-state.service';

const project: Project = {
  _id: 'project-1',
  title: 'Frontend Platform',
  description: 'Angular workspace',
  owner: { _id: 'owner-1', name: 'Owner User', email: 'owner@example.com', role: 'user' },
  members: [{ _id: 'member-1', name: 'Member User', email: 'member@example.com', role: 'user' }],
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

function createProjectsPage(data: Project[]): ProjectsPage {
  return {
    data,
    totalDocs: data.length,
    totalPages: data.length ? 1 : 0,
    currentPage: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };
}

describe('ProjectsPageComponent', () => {
  let fixture: ComponentFixture<ProjectsPageComponent>;
  let state: {
    currentUser: ReturnType<typeof signal<{ _id: string } | null>>;
    query: ReturnType<typeof signal<ProjectsQuery>>;
    projectsPage: ReturnType<typeof signal<ProjectsPage | null>>;
    projects: ReturnType<typeof signal<Project[]>>;
    isListLoading: ReturnType<typeof signal<boolean>>;
    listError: ReturnType<typeof signal<string>>;
    loadProjects: jasmine.Spy;
    canEdit: jasmine.Spy;
    isOwner: jasmine.Spy;
  };

  function createRouter(): jasmine.SpyObj<Router> {
    const router = jasmine.createSpyObj<Router>('Router', ['navigate', 'createUrlTree', 'serializeUrl'], { events: of() });
    router.createUrlTree.and.returnValue({} as ReturnType<Router['createUrlTree']>);
    router.serializeUrl.and.returnValue('/');

    return router;
  }

  beforeEach(async () => {
    state = {
      currentUser: signal({ _id: 'owner-1' }),
      query: signal({ page: 1, limit: 10, status: 'all' }),
      projectsPage: signal<ProjectsPage | null>(createProjectsPage([])),
      projects: signal<Project[]>([]),
      isListLoading: signal(false),
      listError: signal(''),
      loadProjects: jasmine.createSpy('loadProjects'),
      canEdit: jasmine.createSpy('canEdit').and.callFake((item: Project) => item.owner._id === 'owner-1' && item.status === 'active'),
      isOwner: jasmine.createSpy('isOwner').and.callFake((item: Project) => item.owner._id === 'owner-1'),
    };

    await TestBed.configureTestingModule({
      imports: [ProjectsPageComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ProjectsStateService, useValue: state },
        { provide: ActivatedRoute, useValue: { queryParamMap: of(convertToParamMap({})) } },
        { provide: Router, useValue: createRouter() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectsPageComponent);
    fixture.detectChanges();
  });

  it('renders an empty state when no projects are available', () => {
    expect(fixture.nativeElement.textContent).toContain('No projects found');
    expect(state.loadProjects).toHaveBeenCalledWith({ page: 1, limit: 10, status: 'all' });
  });

  it('renders project cards with status and owner actions', () => {
    state.projects.set([
      project,
      {
        ...project,
        _id: 'project-2',
        title: 'Archived Work',
        owner: { _id: 'member-owner', name: 'Other Owner', email: 'other@example.com', role: 'user' },
        status: 'archived',
      },
    ]);
    state.projectsPage.set(createProjectsPage(state.projects()));
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    const ownerBadges = fixture.nativeElement.querySelectorAll('.projects-page__owner-badge');

    expect(text).toContain('Frontend Platform');
    expect(text).toContain('Active');
    expect(text).toContain('Archived Work');
    expect(text).toContain('Archived');
    expect(text).toContain('Edit');
    expect(ownerBadges.length).toBe(1);
    expect(ownerBadges[0].getAttribute('aria-label')).toBe('Owner');
  });
});
