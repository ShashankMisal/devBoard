import { PaginatedResponse } from '../../../core/api/api.models';

export type ProjectStatus = 'active' | 'archived';
export type ProjectStatusFilter = ProjectStatus | 'all';

export interface ProjectUser {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface Project {
  _id: string;
  title: string;
  description: string;
  owner: ProjectUser;
  members: ProjectUser[];
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectsQuery {
  page: number;
  limit: number;
  status: ProjectStatusFilter;
}

export type ProjectsPage = PaginatedResponse<Project>;

export interface CreateProjectRequest {
  title: string;
  description?: string;
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  status?: ProjectStatus;
}

export interface AddProjectMemberRequest {
  email: string;
}
