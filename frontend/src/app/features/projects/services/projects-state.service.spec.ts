import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AppApiError } from '../../../core/api/api.models';
import { User } from '../../../core/auth/auth.models';
import { SessionService } from '../../../core/auth/session.service';
import { Project, ProjectsPage } from '../models/project.models';
import { ProjectsApiService } from './projects-api.service';
import { ProjectsStateService } from './projects-state.service';

const owner: User = {
  _id: 'owner-1',
  name: 'Owner User',
  email: 'owner@example.com',
  role: 'user',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const project: Project = {
  _id: 'project-1',
  title: 'Frontend Platform',
  description: 'Angular workspace',
  owner: { _id: owner._id, name: owner.name, email: owner.email, role: owner.role },
  members: [{ _id: 'member-1', name: 'Member User', email: 'member@example.com', role: 'user' }],
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

const projectsPage: ProjectsPage = {
  data: [project],
  totalDocs: 1,
  totalPages: 1,
  currentPage: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

describe('ProjectsStateService', () => {
  let projectsApi: jasmine.SpyObj<ProjectsApiService>;
  let service: ProjectsStateService;
  let userSignal: ReturnType<typeof signal<User | null>>;

  beforeEach(() => {
    projectsApi = jasmine.createSpyObj<ProjectsApiService>('ProjectsApiService', [
      'getProjects',
      'createProject',
      'getProject',
      'updateProject',
      'addMember',
    ]);
    userSignal = signal<User | null>(owner);

    TestBed.configureTestingModule({
      providers: [
        ProjectsStateService,
        { provide: ProjectsApiService, useValue: projectsApi },
        { provide: SessionService, useValue: { user: userSignal } },
      ],
    });

    service = TestBed.inject(ProjectsStateService);
  });

  it('normalizes query params and stores loaded projects', () => {
    projectsApi.getProjects.and.returnValue(of(projectsPage));

    service.loadProjects({ page: 0, limit: 100, status: 'archived' });

    expect(projectsApi.getProjects).toHaveBeenCalledWith({ page: 1, limit: 50, status: 'archived' });
    expect(service.projects()).toEqual([project]);
    expect(service.projectsPage()).toEqual(projectsPage);
    expect(service.isListLoading()).toBeFalse();
  });

  it('stores list errors from the API', () => {
    const error: AppApiError = { message: 'Projects failed.', kind: 'server', fields: {} };
    projectsApi.getProjects.and.returnValue(throwError(() => error));

    service.loadProjects();

    expect(service.listError()).toBe('Projects failed.');
    expect(service.isListLoading()).toBeFalse();
  });

  it('derives owner, member, archive, and read-only permissions', () => {
    expect(service.isOwner(project)).toBeTrue();
    expect(service.isMember(project)).toBeFalse();
    expect(service.canEdit(project)).toBeTrue();
    expect(service.canArchive(project)).toBeTrue();
    expect(service.canUnarchive(project)).toBeFalse();

    const archivedProject: Project = { ...project, status: 'archived' };

    expect(service.canEdit(archivedProject)).toBeFalse();
    expect(service.canManageMembers(archivedProject)).toBeFalse();
    expect(service.canUnarchive(archivedProject)).toBeTrue();
    expect(service.isReadOnly(archivedProject)).toBeTrue();

    userSignal.set({ ...owner, _id: 'member-1' });

    expect(service.isOwner(project)).toBeFalse();
    expect(service.isMember(project)).toBeTrue();
    expect(service.canEdit(project)).toBeFalse();
  });

  it('updates selected and listed project after member changes', () => {
    const updatedProject: Project = {
      ...project,
      members: [...project.members, { _id: 'member-2', name: 'Second Member', email: 'second@example.com', role: 'user' }],
    };
    projectsApi.getProjects.and.returnValue(of(projectsPage));
    projectsApi.addMember.and.returnValue(of(updatedProject));
    service.loadProjects();

    service.addMember(project._id, { email: ' SECOND@EXAMPLE.COM ' }).subscribe();

    expect(projectsApi.addMember).toHaveBeenCalledWith(project._id, { email: 'second@example.com' });
    expect(service.selectedProject()).toEqual(updatedProject);
    expect(service.projects()[0]).toEqual(updatedProject);
  });
});
