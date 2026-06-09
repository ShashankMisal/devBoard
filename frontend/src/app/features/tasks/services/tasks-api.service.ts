import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from '../../../core/api/api-client.service';
import {
  CreateTaskRequest,
  Task,
  TaskBoard,
  TaskBoardQuery,
  TasksPage,
  TasksQuery,
  UpdateTaskRequest,
} from '../models/task.models';

@Injectable({ providedIn: 'root' })
export class TasksApiService {
  private readonly apiClient = inject(ApiClient);

  getProjectTasks(projectId: string, query: TasksQuery): Observable<TasksPage> {
    const params: Record<string, string | number> = {
      page: query.page,
      limit: query.limit,
    };

    if (query.status !== 'all') {
      params['status'] = query.status;
    }

    if (query.priority !== 'all') {
      params['priority'] = query.priority;
    }

    if (query.sortBy !== 'newest') {
      params['sortBy'] = query.sortBy;
    }

    return this.apiClient.get<TasksPage>(`/projects/${projectId}/tasks`, { params });
  }

  getProjectTaskBoard(projectId: string, query: TaskBoardQuery): Observable<TaskBoard> {
    const params: Record<string, string> = {};

    if (query.priority !== 'all') {
      params['priority'] = query.priority;
    }

    if (query.sortBy !== 'newest') {
      params['sortBy'] = query.sortBy;
    }

    return this.apiClient.get<TaskBoard>(`/projects/${projectId}/tasks/board`, { params });
  }

  createProjectTask(projectId: string, payload: CreateTaskRequest): Observable<Task> {
    return this.apiClient.post<Task, CreateTaskRequest>(`/projects/${projectId}/tasks`, payload);
  }

  getTask(taskId: string): Observable<Task> {
    return this.apiClient.get<Task>(`/tasks/${taskId}`);
  }

  updateTask(taskId: string, payload: UpdateTaskRequest): Observable<Task> {
    return this.apiClient.put<Task, UpdateTaskRequest>(`/tasks/${taskId}`, payload);
  }

  deleteTask(taskId: string): Observable<Task> {
    return this.apiClient.delete<Task>(`/tasks/${taskId}`);
  }
}
