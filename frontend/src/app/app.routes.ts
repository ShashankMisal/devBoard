import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
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
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/dashboard/dashboard-page.component').then((component) => component.DashboardPageComponent),
      },
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/login/login-page.component').then((component) => component.LoginPageComponent),
      },
      {
        path: 'register',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/register/register-page.component').then((component) => component.RegisterPageComponent),
      },
      {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/profile/profile-page.component').then((component) => component.ProfilePageComponent),
      },
      {
        path: 'projects',
        canActivate: [authGuard],
        loadChildren: () => import('./features/projects/projects.routes').then((routes) => routes.projectRoutes),
      },
      {
        path: 'tasks',
        canActivate: [authGuard],
        loadComponent: () => import('./features/tasks/tasks-page.component').then((component) => component.TasksPageComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
