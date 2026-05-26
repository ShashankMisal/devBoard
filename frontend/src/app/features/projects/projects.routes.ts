import { Routes } from '@angular/router';

import { ProjectDetailPageComponent } from './project-detail/project-detail-page.component';
import { ProjectFormPageComponent } from './project-form/project-form-page.component';
import { ProjectsPageComponent } from './projects-page.component';

export const projectRoutes: Routes = [
  {
    path: '',
    component: ProjectsPageComponent,
  },
  {
    path: 'new',
    component: ProjectFormPageComponent,
  },
  {
    path: ':id',
    component: ProjectDetailPageComponent,
  },
  {
    path: ':id/edit',
    component: ProjectFormPageComponent,
  },
];
