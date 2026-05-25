import { ChangeDetectionStrategy, Component } from '@angular/core';

import { FeaturePlaceholderComponent } from '../../shared/ui/feature-placeholder/feature-placeholder.component';

@Component({
  selector: 'app-projects-page',
  imports: [FeaturePlaceholderComponent],
  template: `
    <app-feature-placeholder
      eyebrow="Projects"
      title="Project workflows start in Phase 3."
      description="This route boundary exists now so the app architecture, lazy loading, and navigation are stable before feature implementation."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsPageComponent {}
