import { ChangeDetectionStrategy, Component } from '@angular/core';

import { FeaturePlaceholderComponent } from '../../shared/ui/feature-placeholder/feature-placeholder.component';

@Component({
  selector: 'app-auth-page',
  imports: [FeaturePlaceholderComponent],
  template: `
    <app-feature-placeholder
      eyebrow="Auth"
      title="Authentication is reserved for Phase 2."
      description="The frontend is prepared for session work, but login, registration, refresh handling, and profile flows are intentionally not implemented in Phase 1."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthPageComponent {}
