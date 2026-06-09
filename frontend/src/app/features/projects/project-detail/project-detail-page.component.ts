import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, finalize } from 'rxjs';

import { AppApiError } from '../../../core/api/api.models';
import { NotificationService } from '../../../core/services/notification.service';
import { SkeletonListComponent } from '../../../shared/ui/skeleton-list/skeleton-list.component';
import { UiStateComponent } from '../../../shared/ui/ui-state/ui-state.component';
import { applyApiFieldErrors, getControlError } from '../../../shared/utils/form-errors';
import { Task, TaskPanelMode, TaskPriorityFilter, TaskSort, TaskStatusFilter } from '../../tasks/models/task.models';
import { TasksStateService } from '../../tasks/services/tasks-state.service';
import { TaskPanelComponent } from '../../tasks/task-panel/task-panel.component';
import { Project, ProjectStatus } from '../models/project.models';
import { ProjectsStateService } from '../services/projects-state.service';

@Component({
  selector: 'app-add-project-member-dialog',
  imports: [MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  template: `
    <h2 mat-dialog-title>Add member</h2>
    <mat-dialog-content>
      <form class="member-dialog__form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        @if (formError()) {
          <p class="member-dialog__error">{{ formError() }}</p>
        }

        <mat-form-field appearance="outline">
          <mat-label>Member email</mat-label>
          <input matInput type="email" formControlName="email" autocomplete="email" />
          @if (getError('email')) {
            <mat-error>{{ getError('email') }}</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
      <button mat-flat-button type="button" [disabled]="isSubmitting()" (click)="submit()">Add member</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .member-dialog__form {
        display: grid;
        min-width: min(360px, calc(100vw - 64px));
        padding-top: var(--space-2);
      }

      .member-dialog__error {
        margin: 0 0 var(--space-3);
        color: var(--app-danger);
        font-weight: 650;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddProjectMemberDialogComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly projectsState = inject(ProjectsStateService);
  readonly dialogRef = inject(MatDialogRef<AddProjectMemberDialogComponent, Project>);
  readonly isSubmitting = signal(false);
  readonly formError = signal('');
  readonly form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
  });

  getError(controlName: string): string {
    return getControlError(this.form, controlName);
  }

  submit(): void {
    this.formError.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const project = this.projectsState.selectedProject();
    if (!project || !this.projectsState.canManageMembers(project)) {
      this.formError.set('Members can only be added by the owner of an active project.');
      return;
    }

    this.isSubmitting.set(true);
    this.projectsState
      .addMember(project._id, this.form.getRawValue())
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (updatedProject) => this.dialogRef.close(updatedProject),
        error: (error: AppApiError) => {
          if (!applyApiFieldErrors(this.form, error)) {
            this.formError.set(error.message);
          }
        },
      });
  }
}

@Component({
  selector: 'app-confirm-project-status-dialog',
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>{{ title() }}</h2>
    <mat-dialog-content>{{ body() }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="dialogRef.close(false)">Cancel</button>
      <button mat-flat-button type="button" [color]="isArchive() ? 'warn' : 'primary'" (click)="dialogRef.close(true)">
        {{ actionLabel() }}
      </button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmProjectStatusDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ConfirmProjectStatusDialogComponent, boolean>);
  readonly isArchive = signal(true);
  readonly title = signal('Archive project?');
  readonly body = signal('Archived projects remain readable but become read-only.');
  readonly actionLabel = signal('Archive');
}

@Component({
  selector: 'app-confirm-task-delete-dialog',
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Delete task?</h2>
    <mat-dialog-content>This permanently removes the task from the project.</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="dialogRef.close(false)">Cancel</button>
      <button mat-flat-button color="warn" type="button" (click)="dialogRef.close(true)">Delete</button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmTaskDeleteDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ConfirmTaskDeleteDialogComponent, boolean>);
}

@Component({
  selector: 'app-project-detail-page',
  imports: [
    DatePipe,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatSelectModule,
    RouterLink,
    SkeletonListComponent,
    TaskPanelComponent,
    UiStateComponent,
  ],
  templateUrl: './project-detail-page.component.html',
  styleUrl: './project-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly notificationService = inject(NotificationService);
  readonly projectsState = inject(ProjectsStateService);
  readonly tasksState = inject(TasksStateService);
  readonly isStatusSubmitting = signal(false);
  readonly taskPanelMode = signal<TaskPanelMode | null>(null);
  readonly statusOptions: { value: TaskStatusFilter; label: string }[] = [
    { value: 'all', label: 'All statuses' },
    { value: 'todo', label: 'To do' },
    { value: 'in-progress', label: 'In progress' },
    { value: 'done', label: 'Done' },
  ];
  readonly priorityOptions: { value: TaskPriorityFilter; label: string }[] = [
    { value: 'all', label: 'All priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];
  readonly sortOptions: { value: TaskSort; label: string }[] = [
    { value: 'newest', label: 'Newest' },
    { value: 'dueDate', label: 'Due date' },
    { value: 'priority', label: 'Priority' },
  ];
  private loadedProjectId = '';

  constructor() {
    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([params, queryParams]) => {
        const projectId = params.get('id');

        if (projectId) {
          if (this.loadedProjectId !== projectId) {
            this.loadedProjectId = projectId;
            this.projectsState.loadProject(projectId);
            this.closeTaskPanel();
          }

          const taskStatus = queryParams.get('taskStatus');
          const taskPriority = queryParams.get('taskPriority');
          const taskSortBy = queryParams.get('taskSortBy');

          this.tasksState.loadProjectTasks(projectId, {
            page: Number(queryParams.get('taskPage') ?? 1),
            limit: Number(queryParams.get('taskLimit') ?? 10),
            status: taskStatus === 'todo' || taskStatus === 'in-progress' || taskStatus === 'done' ? taskStatus : 'all',
            priority:
              taskPriority === 'low' || taskPriority === 'medium' || taskPriority === 'high' ? taskPriority : 'all',
            sortBy: taskSortBy === 'dueDate' || taskSortBy === 'priority' ? taskSortBy : 'newest',
          });
        }
      });
  }

  openAddMemberDialog(): void {
    const dialogRef = this.dialog.open(AddProjectMemberDialogComponent, {
      width: 'min(460px, calc(100vw - 32px))',
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((updatedProject) => {
        if (updatedProject) {
          this.notificationService.success('Project member added successfully.');
        }
      });
  }

  confirmArchive(project: Project): void {
    this.confirmStatusChange(project, true);
  }

  confirmUnarchive(project: Project): void {
    this.confirmStatusChange(project, false);
  }

  statusLabel(status: ProjectStatus): string {
    return status === 'active' ? 'Active' : 'Archived';
  }

  changeTaskStatus(status: TaskStatusFilter): void {
    this.updateTaskQuery({ taskPage: 1, taskStatus: status === 'all' ? null : status });
  }

  changeTaskPriority(priority: TaskPriorityFilter): void {
    this.updateTaskQuery({ taskPage: 1, taskPriority: priority === 'all' ? null : priority });
  }

  changeTaskSort(sortBy: TaskSort): void {
    this.updateTaskQuery({ taskPage: 1, taskSortBy: sortBy === 'newest' ? null : sortBy });
  }

  changeTaskPage(event: PageEvent): void {
    this.updateTaskQuery({
      taskPage: event.pageIndex + 1,
      taskLimit: event.pageSize,
    });
  }

  openCreateTaskPanel(): void {
    this.tasksState.clearSelectedTask();
    this.taskPanelMode.set('create');
  }

  openTaskPanel(task: Task, mode: TaskPanelMode = 'detail'): void {
    this.taskPanelMode.set(mode);
    this.tasksState.loadTask(task._id);
  }

  closeTaskPanel(): void {
    this.taskPanelMode.set(null);
    this.tasksState.clearSelectedTask();
  }

  switchTaskPanelToEdit(task: Task): void {
    this.taskPanelMode.set('edit');
    this.tasksState.loadTask(task._id);
  }

  handleTaskSaved(): void {
    const project = this.projectsState.selectedProject();

    if (project) {
      this.tasksState.loadProjectTasks(project._id, this.tasksState.query());
    }

    this.taskPanelMode.set('detail');
  }

  confirmTaskDelete(task: Task): void {
    const dialogRef = this.dialog.open(ConfirmTaskDeleteDialogComponent, {
      width: 'min(420px, calc(100vw - 32px))',
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.deleteTask(task);
        }
      });
  }

  taskStatusLabel(status: Task['status']): string {
    return this.tasksState.statusLabel(status);
  }

  taskPriorityLabel(priority: Task['priority']): string {
    return this.tasksState.priorityLabel(priority);
  }

  private confirmStatusChange(project: Project, archive: boolean): void {
    const dialogRef = this.dialog.open(ConfirmProjectStatusDialogComponent, {
      width: 'min(420px, calc(100vw - 32px))',
    });
    const component = dialogRef.componentInstance;

    component.isArchive.set(archive);
    component.title.set(archive ? 'Archive project?' : 'Unarchive project?');
    component.body.set(
      archive
        ? 'Archived projects remain readable but become read-only for project and task changes.'
        : 'This restores owner editing and member management for the project.',
    );
    component.actionLabel.set(archive ? 'Archive' : 'Unarchive');

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.setProjectStatus(project, archive ? 'archived' : 'active');
        }
      });
  }

  private setProjectStatus(project: Project, status: 'active' | 'archived'): void {
    this.isStatusSubmitting.set(true);
    this.projectsState
      .setProjectStatus(project, status)
      .pipe(finalize(() => this.isStatusSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.notificationService.success(status === 'archived' ? 'Project archived.' : 'Project unarchived.');
        },
        error: (error: AppApiError) => {
          this.notificationService.error(error.message);
        },
      });
  }

  private deleteTask(task: Task): void {
    this.tasksState.deleteTask(task._id).subscribe({
      next: () => {
        this.notificationService.success('Task deleted successfully.');
        this.closeTaskPanel();

        const project = this.projectsState.selectedProject();
        if (project) {
          this.tasksState.loadProjectTasks(project._id, this.tasksState.query());
        }
      },
      error: (error: AppApiError) => {
        this.notificationService.error(error.message);
      },
    });
  }

  private updateTaskQuery(queryParams: Record<string, string | number | null>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }
}
