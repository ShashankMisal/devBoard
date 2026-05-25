import { Routes } from '@angular/router';

import { AppShellComponent } from './core/layout/app-shell/app-shell.component';

export const routes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard-page.component').then((component) => component.DashboardPageComponent),
      },
      {
        path: 'auth',
        loadComponent: () => import('./features/auth/auth-page.component').then((component) => component.AuthPageComponent),
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./features/projects/projects-page.component').then((component) => component.ProjectsPageComponent),
      },
      {
        path: 'tasks',
        loadComponent: () => import('./features/tasks/tasks-page.component').then((component) => component.TasksPageComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
