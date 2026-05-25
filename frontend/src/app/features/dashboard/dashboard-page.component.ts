import { ChangeDetectionStrategy, Component } from '@angular/core';

import { FeaturePlaceholderComponent } from '../../shared/ui/feature-placeholder/feature-placeholder.component';

@Component({
  selector: 'app-dashboard-page',
  imports: [FeaturePlaceholderComponent],
  template: `
    <app-feature-placeholder
      eyebrow="Phase 1 Foundation"
      title="A clean workspace shell for DevBoard."
      description="The frontend foundation is ready for auth, projects, and task workflows without implementing those business features early."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent {}
