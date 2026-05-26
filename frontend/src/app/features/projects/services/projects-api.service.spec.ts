import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ApiClient } from '../../../core/api/api-client.service';
import { Project, ProjectsPage } from '../models/project.models';
import { ProjectsApiService } from './projects-api.service';

const project: Project = {
  _id: 'project-1',
  title: 'Frontend Platform',
  description: 'Angular workspace',
  owner: { _id: 'owner-1', name: 'Owner User', email: 'owner@example.com', role: 'user' },
  members: [],
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

describe('ProjectsApiService', () => {
  let apiClient: jasmine.SpyObj<ApiClient>;
  let service: ProjectsApiService;

  beforeEach(() => {
    apiClient = jasmine.createSpyObj<ApiClient>('ApiClient', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [ProjectsApiService, { provide: ApiClient, useValue: apiClient }],
    });

    service = TestBed.inject(ProjectsApiService);
  });

  it('requests paginated projects without sending all status to the backend', () => {
    apiClient.get.and.returnValue(of(projectsPage));

    service.getProjects({ page: 2, limit: 25, status: 'all' }).subscribe();

    expect(apiClient.get).toHaveBeenCalledWith('/projects', { params: { page: 2, limit: 25 } });
  });

  it('requests filtered archived projects', () => {
    apiClient.get.and.returnValue(of(projectsPage));

    service.getProjects({ page: 1, limit: 10, status: 'archived' }).subscribe();

    expect(apiClient.get).toHaveBeenCalledWith('/projects', { params: { page: 1, limit: 10, status: 'archived' } });
  });

  it('uses backend project endpoints and payloads for writes', () => {
    apiClient.post.and.returnValue(of(project));
    apiClient.put.and.returnValue(of(project));

    service.createProject({ title: 'New', description: 'Description' }).subscribe();
    service.updateProject('project-1', { status: 'archived' }).subscribe();
    service.addMember('project-1', { email: 'member@example.com' }).subscribe();

    expect(apiClient.post).toHaveBeenCalledWith('/projects', { title: 'New', description: 'Description' });
    expect(apiClient.put).toHaveBeenCalledWith('/projects/project-1', { status: 'archived' });
    expect(apiClient.post).toHaveBeenCalledWith('/projects/project-1/members', { email: 'member@example.com' });
  });
});
