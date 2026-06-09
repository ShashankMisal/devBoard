import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AppApiError } from '../../../core/api/api.models';
import { User } from '../../../core/auth/auth.models';
import { SessionService } from '../../../core/auth/session.service';
import { Project } from '../../projects/models/project.models';
import { Task, TaskBoard, TasksPage } from '../models/task.models';
import { TasksApiService } from './tasks-api.service';
import { TasksStateService } from './tasks-state.service';

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

const task: Task = {
  _id: 'task-1',
  title: 'Build task UI',
  description: 'Create the project task experience.',
  project: {
    _id: project._id,
    title: project.title,
    status: project.status,
    owner: project.owner,
    members: project.members,
  },
  assignee: project.members[0],
  createdBy: project.owner,
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
const taskBoard: TaskBoard = {
  columns: [
    { status: 'todo', label: 'To do', tasks: [task], count: 1 },
    { status: 'in-progress', label: 'In progress', tasks: [], count: 0 },
    { status: 'done', label: 'Done', tasks: [], count: 0 },
  ],
  totalDocs: 1,
};

describe('TasksStateService', () => {
  let tasksApi: jasmine.SpyObj<TasksApiService>;
  let service: TasksStateService;
  let userSignal: ReturnType<typeof signal<User | null>>;

  beforeEach(() => {
    tasksApi = jasmine.createSpyObj<TasksApiService>('TasksApiService', [
      'getProjectTasks',
      'getProjectTaskBoard',
      'createProjectTask',
      'getTask',
      'updateTask',
      'deleteTask',
    ]);
    userSignal = signal<User | null>(owner);

    TestBed.configureTestingModule({
      providers: [
        TasksStateService,
        { provide: TasksApiService, useValue: tasksApi },
        { provide: SessionService, useValue: { user: userSignal } },
      ],
    });

    service = TestBed.inject(TasksStateService);
  });

  it('normalizes query params and stores loaded tasks', () => {
    tasksApi.getProjectTasks.and.returnValue(of(tasksPage));

    service.loadProjectTasks('project-1', {
      page: 0,
      limit: 100,
      status: 'done',
      priority: 'high',
      sortBy: 'priority',
    });

    expect(tasksApi.getProjectTasks).toHaveBeenCalledWith('project-1', {
      page: 1,
      limit: 50,
      status: 'done',
      priority: 'high',
      sortBy: 'priority',
    });
    expect(service.tasks()).toEqual([task]);
    expect(service.isListLoading()).toBeFalse();
  });

  it('stores list errors from the API', () => {
    const error: AppApiError = { message: 'Tasks failed.', kind: 'server', fields: {} };
    tasksApi.getProjectTasks.and.returnValue(throwError(() => error));

    service.loadProjectTasks('project-1');

    expect(service.listError()).toBe('Tasks failed.');
    expect(service.isListLoading()).toBeFalse();
  });

  it('normalizes query params and stores loaded task board', () => {
    tasksApi.getProjectTaskBoard.and.returnValue(of(taskBoard));

    service.loadProjectTaskBoard('project-1', {
      priority: 'high',
      sortBy: 'priority',
    });

    expect(tasksApi.getProjectTaskBoard).toHaveBeenCalledWith('project-1', {
      priority: 'high',
      sortBy: 'priority',
    });
    expect(service.taskBoard()).toEqual(taskBoard);
    expect(service.isBoardLoading()).toBeFalse();
  });

  it('stores board errors from the API', () => {
    const error: AppApiError = { message: 'Board failed.', kind: 'server', fields: {} };
    tasksApi.getProjectTaskBoard.and.returnValue(throwError(() => error));

    service.loadProjectTaskBoard('project-1');

    expect(service.boardError()).toBe('Board failed.');
    expect(service.isBoardLoading()).toBeFalse();
  });

  it('replaces and removes tasks after writes', () => {
    const updatedTask: Task = { ...task, status: 'done', updatedAt: '2026-01-02T00:00:00.000Z' };
    tasksApi.getProjectTasks.and.returnValue(of(tasksPage));
    tasksApi.updateTask.and.returnValue(of(updatedTask));
    tasksApi.deleteTask.and.returnValue(of(updatedTask));
    service.loadProjectTasks('project-1');

    service.updateTask(task._id, { status: 'done' }).subscribe();
    expect(service.tasks()[0]).toEqual(updatedTask);

    service.deleteTask(task._id).subscribe();
    expect(service.tasks()).toEqual([]);
    expect(service.tasksPage()?.totalDocs).toBe(0);
  });

  it('optimistically moves tasks across board columns and reverts on failure', () => {
    const updatedTask: Task = { ...task, status: 'done', updatedAt: '2026-01-02T00:00:00.000Z' };
    const error: AppApiError = { message: 'Move failed.', kind: 'server', fields: {} };
    tasksApi.getProjectTasks.and.returnValue(of(tasksPage));
    tasksApi.getProjectTaskBoard.and.returnValue(of(taskBoard));
    tasksApi.updateTask.and.returnValues(
      of(updatedTask),
      throwError(() => error),
    );
    service.loadProjectTasks('project-1');
    service.loadProjectTaskBoard('project-1');

    service.moveTask(project, task, 'done').subscribe();
    expect(service.taskBoard()?.columns.find((column) => column.status === 'done')?.tasks).toEqual([updatedTask]);

    service.moveTask(project, updatedTask, 'in-progress').subscribe({ error: () => undefined });
    expect(service.taskBoard()?.columns.find((column) => column.status === 'done')?.tasks).toEqual([updatedTask]);
    expect(service.taskBoard()?.columns.find((column) => column.status === 'in-progress')?.tasks).toEqual([]);
  });

  it('derives task permissions from project state and current user', () => {
    expect(service.canCreate(project)).toBeTrue();
    expect(service.canUpdate(project, task)).toBeTrue();
    expect(service.canDelete(project, task)).toBeTrue();

    userSignal.set({ ...owner, _id: 'member-1' });

    expect(service.canUpdate(project, task)).toBeTrue();
    expect(service.canDelete(project, task)).toBeFalse();

    const archivedProject: Project = { ...project, status: 'archived' };

    expect(service.canCreate(archivedProject)).toBeFalse();
    expect(service.canUpdate(archivedProject, task)).toBeFalse();
    expect(service.canDelete(archivedProject, task)).toBeFalse();
  });
});
