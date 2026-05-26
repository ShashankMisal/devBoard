import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from '../../../core/api/api-client.service';
import {
  AddProjectMemberRequest,
  CreateProjectRequest,
  Project,
  ProjectsPage,
  ProjectsQuery,
  UpdateProjectRequest,
} from '../models/project.models';

@Injectable({ providedIn: 'root' })
export class ProjectsApiService {
  private readonly apiClient = inject(ApiClient);

  getProjects(query: ProjectsQuery): Observable<ProjectsPage> {
    const params: Record<string, string | number> = {
      page: query.page,
      limit: query.limit,
    };

    if (query.status !== 'all') {
      params['status'] = query.status;
    }

    return this.apiClient.get<ProjectsPage>('/projects', { params });
  }

  createProject(payload: CreateProjectRequest): Observable<Project> {
    return this.apiClient.post<Project, CreateProjectRequest>('/projects', payload);
  }

  getProject(projectId: string): Observable<Project> {
    return this.apiClient.get<Project>(`/projects/${projectId}`);
  }

  updateProject(projectId: string, payload: UpdateProjectRequest): Observable<Project> {
    return this.apiClient.put<Project, UpdateProjectRequest>(`/projects/${projectId}`, payload);
  }

  addMember(projectId: string, payload: AddProjectMemberRequest): Observable<Project> {
    return this.apiClient.post<Project, AddProjectMemberRequest>(`/projects/${projectId}/members`, payload);
  }
}
