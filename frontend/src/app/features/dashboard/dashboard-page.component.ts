import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { RouterLink } from '@angular/router';

import { SkeletonListComponent } from '../../shared/ui/skeleton-list/skeleton-list.component';
import { UiStateComponent } from '../../shared/ui/ui-state/ui-state.component';
import { TaskPriority, TaskStatus } from '../tasks/models/task.models';
import { DashboardStateService } from './services/dashboard-state.service';

@Component({
  selector: 'app-dashboard-page',
  imports: [DatePipe, MatButtonModule, MatCardModule, MatChipsModule, RouterLink, SkeletonListComponent, UiStateComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent implements OnInit {
  readonly dashboardState = inject(DashboardStateService);

  ngOnInit(): void {
    this.dashboardState.loadSummary();
  }

  taskStatusLabel(status: TaskStatus): string {
    if (status === 'in-progress') {
      return 'In progress';
    }

    return status === 'todo' ? 'To do' : 'Done';
  }

  taskPriorityLabel(priority: TaskPriority): string {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  }
}
