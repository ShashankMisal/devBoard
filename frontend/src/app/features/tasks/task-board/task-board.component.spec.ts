import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { Project } from '../../projects/models/project.models';
import { Task, TaskBoard } from '../models/task.models';
import { TasksStateService } from '../services/tasks-state.service';
import { TaskBoardComponent } from './task-board.component';

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

const board: TaskBoard = {
  columns: [
    { status: 'todo', label: 'To do', tasks: [task], count: 1 },
    { status: 'in-progress', label: 'In progress', tasks: [], count: 0 },
    { status: 'done', label: 'Done', tasks: [], count: 0 },
  ],
  totalDocs: 1,
};

describe('TaskBoardComponent', () => {
  let fixture: ComponentFixture<TaskBoardComponent>;
  let component: TaskBoardComponent;
  let tasksState: jasmine.SpyObj<Pick<TasksStateService, 'canUpdate' | 'canDelete' | 'priorityLabel'>>;

  beforeEach(async () => {
    tasksState = jasmine.createSpyObj('TasksStateService', ['canUpdate', 'canDelete', 'priorityLabel']);
    tasksState.canUpdate.and.returnValue(true);
    tasksState.canDelete.and.returnValue(true);
    tasksState.priorityLabel.and.returnValue('Medium');

    await TestBed.configureTestingModule({
      imports: [TaskBoardComponent],
      providers: [provideNoopAnimations(), { provide: TasksStateService, useValue: tasksState }],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskBoardComponent);
    component = fixture.componentInstance;
    component.project = project;
    component.board = board;
    fixture.detectChanges();
  });

  it('renders all board columns and empty states', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('To do');
    expect(text).toContain('In progress');
    expect(text).toContain('Done');
    expect(text).toContain('Build task UI');
    expect(text).toContain('No tasks in this column.');
  });

  it('emits task open and action events', () => {
    spyOn(component.taskOpened, 'emit');
    spyOn(component.editRequested, 'emit');
    spyOn(component.deleteRequested, 'emit');

    const buttons = Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button'));

    buttons.find((button) => button.textContent?.includes('Build task UI'))?.click();
    buttons.find((button) => button.textContent?.trim() === 'Edit')?.click();
    buttons.find((button) => button.textContent?.trim() === 'Delete')?.click();

    expect(component.taskOpened.emit).toHaveBeenCalledWith(task);
    expect(component.editRequested.emit).toHaveBeenCalledWith(task);
    expect(component.deleteRequested.emit).toHaveBeenCalledWith(task);
  });
});
