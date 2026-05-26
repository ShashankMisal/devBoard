import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AppApiError } from '../../../core/api/api.models';
import { NotificationService } from '../../../core/services/notification.service';
import { applyApiFieldErrors, getControlError } from '../../../shared/utils/form-errors';
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
  selector: 'app-project-detail-page',
  imports: [DatePipe, MatButtonModule, MatChipsModule, RouterLink],
  templateUrl: './project-detail-page.component.html',
  styleUrl: './project-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly notificationService = inject(NotificationService);
  readonly projectsState = inject(ProjectsStateService);
  readonly isStatusSubmitting = signal(false);

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const projectId = params.get('id');

      if (projectId) {
        this.projectsState.loadProject(projectId);
      }
    });
  }

  openAddMemberDialog(): void {
    const dialogRef = this.dialog.open(AddProjectMemberDialogComponent, {
      width: 'min(460px, calc(100vw - 32px))',
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((updatedProject) => {
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

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmed) => {
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
}
