import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ApiClient } from '../../../core/api/api-client.service';
import { Task, TasksPage } from '../models/task.models';
import { TasksApiService } from './tasks-api.service';

const task: Task = {
  _id: 'task-1',
  title: 'Build task UI',
  description: 'Create the project task experience.',
  project: {
    _id: 'project-1',
    title: 'Frontend Platform',
    status: 'active',
    owner: { _id: 'owner-1', name: 'Owner User', email: 'owner@example.com', role: 'user' },
    members: [],
  },
  assignee: null,
  createdBy: { _id: 'owner-1', name: 'Owner User', email: 'owner@example.com', role: 'user' },
  status: 'todo',
  priority: 'medium',
  dueDate: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const tasksPage: TasksPage = {
  data: [task],
  totalDocs: 1,
  totalPages: 1,
  currentPage: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

describe('TasksApiService', () => {
  let apiClient: jasmine.SpyObj<ApiClient>;
  let service: TasksApiService;

  beforeEach(() => {
    apiClient = jasmine.createSpyObj<ApiClient>('ApiClient', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [TasksApiService, { provide: ApiClient, useValue: apiClient }],
    });

    service = TestBed.inject(TasksApiService);
  });

  it('requests project tasks without all/default filters', () => {
    apiClient.get.and.returnValue(of(tasksPage));

    service.getProjectTasks('project-1', { page: 1, limit: 10, status: 'all', priority: 'all', sortBy: 'newest' }).subscribe();

    expect(apiClient.get).toHaveBeenCalledWith('/projects/project-1/tasks', { params: { page: 1, limit: 10 } });
  });

  it('requests filtered and sorted project tasks', () => {
    apiClient.get.and.returnValue(of(tasksPage));

    service.getProjectTasks('project-1', { page: 2, limit: 25, status: 'done', priority: 'high', sortBy: 'priority' }).subscribe();

    expect(apiClient.get).toHaveBeenCalledWith('/projects/project-1/tasks', {
      params: { page: 2, limit: 25, status: 'done', priority: 'high', sortBy: 'priority' },
    });
  });

  it('uses backend task endpoints and payloads for writes', () => {
    apiClient.post.and.returnValue(of(task));
    apiClient.put.and.returnValue(of(task));
    apiClient.delete.and.returnValue(of(task));

    service.createProjectTask('project-1', { title: 'New task', assignee: null }).subscribe();
    service.updateTask('task-1', { status: 'done' }).subscribe();
    service.deleteTask('task-1').subscribe();

    expect(apiClient.post).toHaveBeenCalledWith('/projects/project-1/tasks', { title: 'New task', assignee: null });
    expect(apiClient.put).toHaveBeenCalledWith('/tasks/task-1', { status: 'done' });
    expect(apiClient.delete).toHaveBeenCalledWith('/tasks/task-1');
  });
});
