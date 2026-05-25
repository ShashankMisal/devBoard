import { ChangeDetectionStrategy, Component } from '@angular/core';

import { FeaturePlaceholderComponent } from '../../shared/ui/feature-placeholder/feature-placeholder.component';

@Component({
  selector: 'app-tasks-page',
  imports: [FeaturePlaceholderComponent],
  template: `
    <app-feature-placeholder
      eyebrow="Tasks"
      title="Task execution views come after projects."
      description="The shell and lazy route are in place while task board logic remains scoped to the later roadmap phase."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksPageComponent {}
