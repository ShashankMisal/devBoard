import { PaginatedResponse } from '../../../core/api/api.models';
import { Project, ProjectUser } from '../../projects/models/project.models';

export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatusFilter = TaskStatus | 'all';
export type TaskPriorityFilter = TaskPriority | 'all';
export type TaskSort = 'newest' | 'dueDate' | 'priority';
export type TaskPanelMode = 'create' | 'detail' | 'edit';

export interface TaskProjectSummary {
  _id: string;
  title: string;
  status: Project['status'];
  owner: ProjectUser;
  members: ProjectUser[];
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  project: TaskProjectSummary;
  assignee: ProjectUser | null;
  createdBy: ProjectUser;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TasksQuery {
  page: number;
  limit: number;
  status: TaskStatusFilter;
  priority: TaskPriorityFilter;
  sortBy: TaskSort;
}

export type TasksPage = PaginatedResponse<Task>;

export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  assignee?: string | null;
}

export type UpdateTaskRequest = Partial<CreateTaskRequest>;
