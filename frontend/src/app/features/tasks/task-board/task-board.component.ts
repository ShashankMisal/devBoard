import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';

import { Project } from '../../projects/models/project.models';
import { Task, TaskBoard, TaskStatus } from '../models/task.models';
import { TasksStateService } from '../services/tasks-state.service';

export interface TaskBoardMoveEvent {
  task: Task;
  status: TaskStatus;
}

@Component({
  selector: 'app-task-board',
  imports: [DatePipe, DragDropModule, MatButtonModule, MatChipsModule],
  templateUrl: './task-board.component.html',
  styleUrl: './task-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskBoardComponent {
  readonly tasksState = inject(TasksStateService);

  @Input({ required: true }) project!: Project;
  @Input({ required: true }) board!: TaskBoard;

  @Output() taskOpened = new EventEmitter<Task>();
  @Output() editRequested = new EventEmitter<Task>();
  @Output() deleteRequested = new EventEmitter<Task>();
  @Output() taskMoved = new EventEmitter<TaskBoardMoveEvent>();

  readonly columnIds = ['task-board-todo', 'task-board-in-progress', 'task-board-done'];

  dropListId(status: TaskStatus): string {
    return `task-board-${status}`;
  }

  dropTask(event: CdkDragDrop<TaskStatus>): void {
    const task = event.item.data as Task;
    const status = event.container.data;

    if (!task || task.status === status || !this.tasksState.canUpdate(this.project, task)) {
      return;
    }

    this.taskMoved.emit({ task, status });
  }
}
