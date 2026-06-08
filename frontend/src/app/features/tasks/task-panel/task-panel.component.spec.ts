import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { AppApiError } from '../../../core/api/api.models';
import { NotificationService } from '../../../core/services/notification.service';
import { Project } from '../../projects/models/project.models';
import { Task } from '../models/task.models';
import { TasksStateService } from '../services/tasks-state.service';
import { TaskPanelComponent } from './task-panel.component';

type TaskStateStub = Pick<
  TasksStateService,
  'detailError' | 'isDetailLoading' | 'canCreate' | 'canUpdate' | 'canDelete' | 'createProjectTask' | 'updateTask' | 'statusLabel' | 'priorityLabel'
>;

const project: Project = {
  _id: 'project-1',
  title: 'Frontend Platform',
  description: 'Angular workspace',
  owner: { _id: 'owner-1', name: 'Owner User', email: 'owner@example.com', role: 'user' },
  members: [{ _id: 'member-1', name: 'Member User', email: 'member@example.com', role: 'user' }],
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

const task: Task = {
  _id: 'task-1',
  title: 'Build task UI',
  description: 'Create the project task experience.',
  project: {
    _id: project._id,
    title: project.title,
    status: project.status,
    owner: project.owner,
    members: project.members,
  },
  assignee: project.members[0],
  createdBy: project.owner,
  status: 'todo',
  priority: 'medium',
  dueDate: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('TaskPanelComponent', () => {
  let state: TaskStateStub;
  let fixture: ComponentFixture<TaskPanelComponent>;

  beforeEach(async () => {
    state = {
      detailError: signal(''),
      isDetailLoading: signal(false),
      canCreate: jasmine.createSpy('canCreate').and.returnValue(true),
      canUpdate: jasmine.createSpy('canUpdate').and.returnValue(true),
      canDelete: jasmine.createSpy('canDelete').and.returnValue(true),
      createProjectTask: jasmine.createSpy('createProjectTask').and.returnValue(of(task)),
      updateTask: jasmine.createSpy('updateTask').and.returnValue(of(task)),
      statusLabel: jasmine.createSpy('statusLabel').and.callFake((status) => (status === 'todo' ? 'To do' : status)),
      priorityLabel: jasmine.createSpy('priorityLabel').and.callFake((priority) => priority.charAt(0).toUpperCase() + priority.slice(1)),
    };

    await TestBed.configureTestingModule({
      imports: [TaskPanelComponent],
      providers: [
        provideNoopAnimations(),
        { provide: TasksStateService, useValue: state },
        { provide: NotificationService, useValue: jasmine.createSpyObj<NotificationService>('NotificationService', ['success', 'error', 'info']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskPanelComponent);
    fixture.componentRef.setInput('project', project);
    fixture.componentRef.setInput('mode', 'create');
    fixture.detectChanges();
  });

  it('requires a valid title before creating a task', () => {
    const component = fixture.componentInstance;

    component.form.controls.title.setValue('A');
    component.submit();

    expect(component.getError('title')).toBe('Use at least 2 characters.');
    expect(state.createProjectTask).not.toHaveBeenCalled();
  });

  it('creates a task with normalized assignee and due date values', () => {
    const component = fixture.componentInstance;
    const savedSpy = jasmine.createSpy('saved');
    component.saved.subscribe(savedSpy);

    component.form.reset({
      title: 'New task',
      description: 'Task description',
      status: 'in-progress',
      priority: 'high',
      dueDate: '2026-06-01',
      assignee: 'member-1',
    });
    component.submit();

    expect(state.createProjectTask).toHaveBeenCalledWith(project._id, {
      title: 'New task',
      description: 'Task description',
      status: 'in-progress',
      priority: 'high',
      dueDate: '2026-06-01',
      assignee: 'member-1',
    });
    expect(savedSpy).toHaveBeenCalledWith(task);
  });

  it('maps backend field errors onto edit form controls', () => {
    const component = fixture.componentInstance;
    const error: AppApiError = {
      message: 'Validation failed.',
      kind: 'validation',
      fields: { title: 'Title is already invalid.' },
    };
    (state.updateTask as jasmine.Spy).and.returnValue(throwError(() => error));

    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('task', task);
    fixture.detectChanges();
    component.form.controls.title.setValue('Invalid title');
    component.submit();

    expect(component.getError('title')).toBe('Title is already invalid.');
  });

  it('emits delete requests from detail mode when allowed', () => {
    const component = fixture.componentInstance;
    const deleteSpy = jasmine.createSpy('deleteRequested');
    component.deleteRequested.subscribe(deleteSpy);

    fixture.componentRef.setInput('mode', 'detail');
    fixture.componentRef.setInput('task', task);
    fixture.detectChanges();
    component.requestDelete();

    expect(deleteSpy).toHaveBeenCalledWith(task);
  });
});
