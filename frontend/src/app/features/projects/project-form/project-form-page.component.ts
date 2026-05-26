import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AppApiError } from '../../../core/api/api.models';
import { NotificationService } from '../../../core/services/notification.service';
import { applyApiFieldErrors, getControlError } from '../../../shared/utils/form-errors';
import { ProjectsStateService } from '../services/projects-state.service';

@Component({
  selector: 'app-project-form-page',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, RouterLink],
  templateUrl: './project-form-page.component.html',
  styleUrl: './project-form-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectFormPageComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notificationService = inject(NotificationService);
  readonly projectsState = inject(ProjectsStateService);
  readonly projectId = signal<string | null>(null);
  readonly isSubmitting = signal(false);
  readonly formError = signal('');
  readonly form = this.formBuilder.group({
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    description: ['', [Validators.maxLength(1000)]],
  });

  readonly isEditMode = signal(false);
  private patchedProjectId = '';

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id');

      this.projectId.set(id);
      this.isEditMode.set(Boolean(id));
      this.formError.set('');
      this.patchedProjectId = '';

      if (id) {
        this.projectsState.loadProject(id);
      } else {
        this.projectsState.clearSelectedProject();
        this.form.reset({ title: '', description: '' });
      }
    });

    effect(() => {
      const project = this.projectsState.selectedProject();
      const id = this.projectId();

      if (!id || !project || project._id !== id || this.patchedProjectId === project._id) {
        return;
      }

      this.form.reset({
        title: project.title,
        description: project.description,
      });
      this.patchedProjectId = project._id;
    });
  }

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
    const projectId = this.projectId();

    if (this.isEditMode() && (!projectId || !project)) {
      this.formError.set('Project details are still loading.');
      return;
    }

    if (this.isEditMode() && !this.projectsState.canEdit(project)) {
      this.formError.set('This project is read-only or you do not have owner access.');
      return;
    }

    this.isSubmitting.set(true);

    const request = projectId
      ? this.projectsState.updateProject(projectId, this.form.getRawValue())
      : this.projectsState.createProject(this.form.getRawValue());

    request.pipe(finalize(() => this.isSubmitting.set(false))).subscribe({
      next: (savedProject) => {
        this.notificationService.success(projectId ? 'Project updated successfully.' : 'Project created successfully.');
        void this.router.navigate(['/projects', savedProject._id]);
      },
      error: (error: AppApiError) => {
        if (!applyApiFieldErrors(this.form, error)) {
          this.formError.set(error.message);
        }
      },
    });
  }
}
