import { computed, Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { AppApiError } from '../../../core/api/api.models';
import { SessionService } from '../../../core/auth/session.service';
import { Project } from '../../projects/models/project.models';
import {
  CreateTaskRequest,
  Task,
  TaskPriority,
  TaskPriorityFilter,
  TaskSort,
  TasksPage,
  TasksQuery,
  TaskStatus,
  TaskStatusFilter,
  UpdateTaskRequest,
} from '../models/task.models';
import { TasksApiService } from './tasks-api.service';

const DEFAULT_TASKS_QUERY: TasksQuery = {
  page: 1,
  limit: 10,
  status: 'all',
  priority: 'all',
  sortBy: 'newest',
};

const TASK_STATUSES: TaskStatus[] = ['todo', 'in-progress', 'done'];
const TASK_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];
const TASK_SORTS: TaskSort[] = ['newest', 'dueDate', 'priority'];

@Injectable({ providedIn: 'root' })
export class TasksStateService {
  private readonly tasksApi = inject(TasksApiService);
  private readonly session = inject(SessionService);
  private readonly tasksPageSignal = signal<TasksPage | null>(null);
  private readonly selectedTaskSignal = signal<Task | null>(null);
  private readonly querySignal = signal<TasksQuery>(DEFAULT_TASKS_QUERY);
  private readonly isListLoadingSignal = signal(false);
  private readonly isDetailLoadingSignal = signal(false);
  private readonly listErrorSignal = signal('');
  private readonly detailErrorSignal = signal('');

  readonly tasksPage = this.tasksPageSignal.asReadonly();
  readonly selectedTask = this.selectedTaskSignal.asReadonly();
  readonly query = this.querySignal.asReadonly();
  readonly isListLoading = this.isListLoadingSignal.asReadonly();
  readonly isDetailLoading = this.isDetailLoadingSignal.asReadonly();
  readonly listError = this.listErrorSignal.asReadonly();
  readonly detailError = this.detailErrorSignal.asReadonly();
  readonly tasks = computed(() => this.tasksPageSignal()?.data ?? []);
  readonly currentUser = this.session.user;

  loadProjectTasks(projectId: string, query: Partial<TasksQuery> = {}): void {
    const normalizedQuery = this.normalizeQuery({ ...this.querySignal(), ...query });

    this.querySignal.set(normalizedQuery);
    this.isListLoadingSignal.set(true);
    this.listErrorSignal.set('');

    this.tasksApi.getProjectTasks(projectId, normalizedQuery).subscribe({
      next: (tasksPage) => {
        this.tasksPageSignal.set(tasksPage);
        this.isListLoadingSignal.set(false);
      },
      error: (error: AppApiError) => {
        this.listErrorSignal.set(error.message);
        this.isListLoadingSignal.set(false);
      },
    });
  }

  loadTask(taskId: string): void {
    this.isDetailLoadingSignal.set(true);
    this.detailErrorSignal.set('');

    this.tasksApi.getTask(taskId).subscribe({
      next: (task) => {
        this.selectedTaskSignal.set(task);
        this.isDetailLoadingSignal.set(false);
      },
      error: (error: AppApiError) => {
        this.selectedTaskSignal.set(null);
        this.detailErrorSignal.set(error.message);
        this.isDetailLoadingSignal.set(false);
      },
    });
  }

  createProjectTask(projectId: string, payload: CreateTaskRequest): Observable<Task> {
    return this.tasksApi.createProjectTask(projectId, this.normalizePayload(payload)).pipe(
      tap((task) => {
        this.selectedTaskSignal.set(task);
        this.prependTask(task);
      }),
    );
  }

  updateTask(taskId: string, payload: UpdateTaskRequest): Observable<Task> {
    return this.tasksApi.updateTask(taskId, this.normalizePayload(payload)).pipe(tap((task) => this.replaceTask(task)));
  }

  deleteTask(taskId: string): Observable<Task> {
    return this.tasksApi.deleteTask(taskId).pipe(
      tap(() => {
        this.selectedTaskSignal.set(null);
        this.removeTask(taskId);
      }),
    );
  }

  clearSelectedTask(): void {
    this.selectedTaskSignal.set(null);
    this.detailErrorSignal.set('');
  }

  canCreate(project: Project | null): boolean {
    return project?.status === 'active';
  }

  canUpdate(project: Project | null, task: Task | null): boolean {
    const currentUserId = this.currentUser()?._id;

    return Boolean(
      project?.status === 'active' &&
        task &&
        currentUserId &&
        (project.owner._id === currentUserId || task.assignee?._id === currentUserId),
    );
  }

  canDelete(project: Project | null, task: Task | null): boolean {
    const currentUserId = this.currentUser()?._id;

    return Boolean(
      project?.status === 'active' &&
        task &&
        currentUserId &&
        (project.owner._id === currentUserId || task.createdBy._id === currentUserId),
    );
  }

  statusLabel(status: TaskStatus): string {
    if (status === 'in-progress') {
      return 'In progress';
    }

    return status === 'todo' ? 'To do' : 'Done';
  }

  priorityLabel(priority: TaskPriority): string {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  }

  private replaceTask(task: Task): void {
    this.selectedTaskSignal.set(task);

    const tasksPage = this.tasksPageSignal();
    if (!tasksPage) {
      return;
    }

    this.tasksPageSignal.set({
      ...tasksPage,
      data: tasksPage.data.map((item) => (item._id === task._id ? task : item)),
    });
  }

  private prependTask(task: Task): void {
    const tasksPage = this.tasksPageSignal();
    if (!tasksPage) {
      return;
    }

    this.tasksPageSignal.set({
      ...tasksPage,
      data: [task, ...tasksPage.data].slice(0, this.querySignal().limit),
      totalDocs: tasksPage.totalDocs + 1,
    });
  }

  private removeTask(taskId: string): void {
    const tasksPage = this.tasksPageSignal();
    if (!tasksPage) {
      return;
    }

    this.tasksPageSignal.set({
      ...tasksPage,
      data: tasksPage.data.filter((task) => task._id !== taskId),
      totalDocs: Math.max(tasksPage.totalDocs - 1, 0),
    });
  }

  private normalizeQuery(query: TasksQuery): TasksQuery {
    const status = TASK_STATUSES.includes(query.status as TaskStatus) ? query.status : 'all';
    const priority = TASK_PRIORITIES.includes(query.priority as TaskPriority) ? query.priority : 'all';
    const sortBy = TASK_SORTS.includes(query.sortBy) ? query.sortBy : DEFAULT_TASKS_QUERY.sortBy;

    return {
      page: Math.max(1, Number(query.page) || DEFAULT_TASKS_QUERY.page),
      limit: Math.min(50, Math.max(1, Number(query.limit) || DEFAULT_TASKS_QUERY.limit)),
      status: status as TaskStatusFilter,
      priority: priority as TaskPriorityFilter,
      sortBy,
    };
  }

  private normalizePayload<T extends CreateTaskRequest | UpdateTaskRequest>(payload: T): T {
    return {
      ...payload,
      title: typeof payload.title === 'string' ? payload.title.trim() : undefined,
      description: typeof payload.description === 'string' ? payload.description.trim() : undefined,
      assignee: payload.assignee || null,
      dueDate: payload.dueDate || null,
    };
  }
}
