import { computed, Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { AppApiError } from '../../../core/api/api.models';
import { SessionService } from '../../../core/auth/session.service';
import {
  AddProjectMemberRequest,
  CreateProjectRequest,
  Project,
  ProjectsPage,
  ProjectsQuery,
  ProjectStatus,
  UpdateProjectRequest,
} from '../models/project.models';
import { ProjectsApiService } from './projects-api.service';

const DEFAULT_PROJECTS_QUERY: ProjectsQuery = {
  page: 1,
  limit: 10,
  status: 'all',
};

@Injectable({ providedIn: 'root' })
export class ProjectsStateService {
  private readonly projectsApi = inject(ProjectsApiService);
  private readonly session = inject(SessionService);
  private readonly projectsPageSignal = signal<ProjectsPage | null>(null);
  private readonly selectedProjectSignal = signal<Project | null>(null);
  private readonly querySignal = signal<ProjectsQuery>(DEFAULT_PROJECTS_QUERY);
  private readonly isListLoadingSignal = signal(false);
  private readonly isDetailLoadingSignal = signal(false);
  private readonly listErrorSignal = signal('');
  private readonly detailErrorSignal = signal('');

  readonly projectsPage = this.projectsPageSignal.asReadonly();
  readonly selectedProject = this.selectedProjectSignal.asReadonly();
  readonly query = this.querySignal.asReadonly();
  readonly isListLoading = this.isListLoadingSignal.asReadonly();
  readonly isDetailLoading = this.isDetailLoadingSignal.asReadonly();
  readonly listError = this.listErrorSignal.asReadonly();
  readonly detailError = this.detailErrorSignal.asReadonly();
  readonly projects = computed(() => this.projectsPageSignal()?.data ?? []);
  readonly currentUser = this.session.user;

  loadProjects(query: Partial<ProjectsQuery> = {}): void {
    const normalizedQuery = this.normalizeQuery({ ...this.querySignal(), ...query });

    this.querySignal.set(normalizedQuery);
    this.isListLoadingSignal.set(true);
    this.listErrorSignal.set('');

    this.projectsApi.getProjects(normalizedQuery).subscribe({
      next: (projectsPage) => {
        this.projectsPageSignal.set(projectsPage);
        this.isListLoadingSignal.set(false);
      },
      error: (error: AppApiError) => {
        this.listErrorSignal.set(error.message);
        this.isListLoadingSignal.set(false);
      },
    });
  }

  loadProject(projectId: string): void {
    this.isDetailLoadingSignal.set(true);
    this.detailErrorSignal.set('');

    this.projectsApi.getProject(projectId).subscribe({
      next: (project) => {
        this.selectedProjectSignal.set(project);
        this.isDetailLoadingSignal.set(false);
      },
      error: (error: AppApiError) => {
        this.selectedProjectSignal.set(null);
        this.detailErrorSignal.set(error.message);
        this.isDetailLoadingSignal.set(false);
      },
    });
  }

  createProject(payload: CreateProjectRequest): Observable<Project> {
    return this.projectsApi.createProject(this.trimCreatePayload(payload));
  }

  updateProject(projectId: string, payload: UpdateProjectRequest): Observable<Project> {
    return this.projectsApi
      .updateProject(projectId, this.trimUpdatePayload(payload))
      .pipe(tap((project) => this.replaceProject(project)));
  }

  setProjectStatus(project: Project, status: ProjectStatus): Observable<Project> {
    return this.updateProject(project._id, { status });
  }

  addMember(projectId: string, payload: AddProjectMemberRequest): Observable<Project> {
    return this.projectsApi
      .addMember(projectId, { email: payload.email.trim().toLowerCase() })
      .pipe(tap((project) => this.replaceProject(project)));
  }

  clearSelectedProject(): void {
    this.selectedProjectSignal.set(null);
    this.detailErrorSignal.set('');
  }

  isOwner(project: Project | null): boolean {
    return Boolean(project && this.currentUser()?._id === project.owner._id);
  }

  isMember(project: Project | null): boolean {
    const currentUserId = this.currentUser()?._id;

    return Boolean(project && currentUserId && project.members.some((member) => member._id === currentUserId));
  }

  canEdit(project: Project | null): boolean {
    return this.isOwner(project) && project?.status === 'active';
  }

  canArchive(project: Project | null): boolean {
    return this.isOwner(project) && project?.status === 'active';
  }

  canUnarchive(project: Project | null): boolean {
    return this.isOwner(project) && project?.status === 'archived';
  }

  canManageMembers(project: Project | null): boolean {
    return this.isOwner(project) && project?.status === 'active';
  }

  isReadOnly(project: Project | null): boolean {
    return project?.status === 'archived';
  }

  private replaceProject(project: Project): void {
    this.selectedProjectSignal.set(project);

    const projectsPage = this.projectsPageSignal();
    if (!projectsPage) {
      return;
    }

    this.projectsPageSignal.set({
      ...projectsPage,
      data: projectsPage.data.map((item) => (item._id === project._id ? project : item)),
    });
  }

  private normalizeQuery(query: ProjectsQuery): ProjectsQuery {
    return {
      page: Math.max(1, Number(query.page) || DEFAULT_PROJECTS_QUERY.page),
      limit: Math.min(50, Math.max(1, Number(query.limit) || DEFAULT_PROJECTS_QUERY.limit)),
      status: ['active', 'archived'].includes(query.status) ? query.status : 'all',
    };
  }

  private trimCreatePayload(payload: CreateProjectRequest): CreateProjectRequest {
    return {
      title: payload.title.trim(),
      description: payload.description?.trim() ?? '',
    };
  }

  private trimUpdatePayload(payload: UpdateProjectRequest): UpdateProjectRequest {
    return {
      ...payload,
      title: typeof payload.title === 'string' ? payload.title.trim() : undefined,
      description: typeof payload.description === 'string' ? payload.description.trim() : undefined,
    };
  }
}
