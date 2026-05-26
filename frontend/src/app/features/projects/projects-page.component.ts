import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ProjectStatus, ProjectStatusFilter } from './models/project.models';
import { ProjectsStateService } from './services/projects-state.service';

@Component({
  selector: 'app-projects-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatSelectModule,
    MatTooltipModule,
    RouterLink,
  ],
  templateUrl: './projects-page.component.html',
  styleUrl: './projects-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly projectsState = inject(ProjectsStateService);
  readonly statusOptions: { value: ProjectStatusFilter; label: string }[] = [
    { value: 'all', label: 'All projects' },
    { value: 'active', label: 'Active' },
    { value: 'archived', label: 'Archived' },
  ];

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((queryParams) => {
      const status = queryParams.get('status');

      this.projectsState.loadProjects({
        page: Number(queryParams.get('page') ?? 1),
        limit: Number(queryParams.get('limit') ?? 10),
        status: status === 'active' || status === 'archived' ? status : 'all',
      });
    });
  }

  changeStatus(status: ProjectStatusFilter): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: 1,
        limit: this.projectsState.query().limit,
        status: status === 'all' ? null : status,
      },
      queryParamsHandling: 'merge',
    });
  }

  changePage(event: PageEvent): void {
    const query = this.projectsState.query();

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: event.pageIndex + 1,
        limit: event.pageSize,
        status: query.status === 'all' ? null : query.status,
      },
      queryParamsHandling: 'merge',
    });
  }

  ownershipLabel(ownerId: string): string {
    return this.projectsState.currentUser()?._id === ownerId ? 'Owner' : 'Member';
  }

  statusLabel(status: ProjectStatus): string {
    return status === 'active' ? 'Active' : 'Archived';
  }
}
