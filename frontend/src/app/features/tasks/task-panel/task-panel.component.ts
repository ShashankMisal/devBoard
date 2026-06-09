import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';

import { AppApiError } from '../../../core/api/api.models';
import { NotificationService } from '../../../core/services/notification.service';
import { Project, ProjectUser } from '../../projects/models/project.models';
import { applyApiFieldErrors, getControlError } from '../../../shared/utils/form-errors';
import { Task, TaskPanelMode, TaskPriority, TaskStatus } from '../models/task.models';
import { TasksStateService } from '../services/tasks-state.service';

@Component({
  selector: 'app-task-panel',
  imports: [
    DatePipe,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './task-panel.component.html',
  styleUrl: './task-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskPanelComponent implements OnChanges {
  private readonly formBuilder = inject(FormBuilder);
  private readonly notificationService = inject(NotificationService);
  readonly tasksState = inject(TasksStateService);

  @Input({ required: true }) project!: Project;
  @Input({ required: true }) mode!: TaskPanelMode;
  @Input() task: Task | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() editRequested = new EventEmitter<Task>();
  @Output() saved = new EventEmitter<Task>();
  @Output() deleteRequested = new EventEmitter<Task>();

  readonly statusOptions: { value: TaskStatus; label: string }[] = [
    { value: 'todo', label: 'To do' },
    { value: 'in-progress', label: 'In progress' },
    { value: 'done', label: 'Done' },
  ];
  readonly priorityOptions: { value: TaskPriority; label: string }[] = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];
  readonly isSubmitting = signal(false);
  readonly formError = signal('');
  readonly form = this.formBuilder.group({
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    description: ['', [Validators.maxLength(1000)]],
    status: ['todo' as TaskStatus, [Validators.required]],
    priority: ['medium' as TaskPriority, [Validators.required]],
    dueDate: [''],
    assignee: [''],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['task']) {
      this.formError.set('');
      this.patchForm();
    }
  }

  get title(): string {
    if (this.mode === 'create') {
      return 'Create task';
    }

    return this.mode === 'edit' ? 'Edit task' : 'Task details';
  }

  get isFormMode(): boolean {
    return this.mode === 'create' || this.mode === 'edit';
  }

  get assigneeOptions(): ProjectUser[] {
    if (!this.project) {
      return [];
    }

    const users = [this.project.owner, ...this.project.members];
    const uniqueUsers = new Map(users.map((user) => [user._id, user]));

    return [...uniqueUsers.values()];
  }

  getError(controlName: string): string {
    return getControlError(this.form, controlName);
  }

  submit(): void {
    this.formError.set('');

    if (!this.isFormMode) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.mode === 'create' && !this.tasksState.canCreate(this.project)) {
      this.formError.set('Tasks cannot be created for archived projects.');
      return;
    }

    if (this.mode === 'edit' && !this.tasksState.canUpdate(this.project, this.task)) {
      this.formError.set('Only the project owner or task assignee can update this task.');
      return;
    }

    this.isSubmitting.set(true);

    const value = this.form.getRawValue();
    const payload = {
      title: value.title ?? '',
      description: value.description ?? '',
      status: value.status ?? 'todo',
      priority: value.priority ?? 'medium',
      dueDate: value.dueDate || null,
      assignee: value.assignee || null,
    };
    const request =
      this.mode === 'create'
        ? this.tasksState.createProjectTask(this.project._id, payload)
        : this.tasksState.updateTask(this.task?._id ?? '', payload);

    request.pipe(finalize(() => this.isSubmitting.set(false))).subscribe({
      next: (savedTask) => {
        this.notificationService.success(
          this.mode === 'create' ? 'Task created successfully.' : 'Task updated successfully.',
        );
        this.saved.emit(savedTask);
      },
      error: (error: AppApiError) => {
        if (!applyApiFieldErrors(this.form, error)) {
          this.formError.set(error.message);
        }
      },
    });
  }

  requestEdit(): void {
    if (this.task) {
      this.editRequested.emit(this.task);
    }
  }

  requestDelete(): void {
    if (this.task) {
      this.deleteRequested.emit(this.task);
    }
  }

  private patchForm(): void {
    if (this.mode === 'create' || !this.task) {
      this.form.reset({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        dueDate: '',
        assignee: '',
      });
      return;
    }

    this.form.reset({
      title: this.task.title,
      description: this.task.description,
      status: this.task.status,
      priority: this.task.priority,
      dueDate: this.toDateInputValue(this.task.dueDate),
      assignee: this.task.assignee?._id ?? '',
    });
  }

  private toDateInputValue(value: string | null): string {
    if (!value) {
      return '';
    }

    return value.slice(0, 10);
  }
}
