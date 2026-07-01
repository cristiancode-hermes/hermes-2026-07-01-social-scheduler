import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login-page.component').then((m) => m.LoginPageComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register-page.component').then(
        (m) => m.RegisterPageComponent
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/app-shell.component').then((m) => m.AppShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard-page.component').then(
            (m) => m.DashboardPageComponent
          ),
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('./pages/calendar-page.component').then(
            (m) => m.CalendarPageComponent
          ),
      },
      {
        path: 'calendar/:view',
        loadComponent: () =>
          import('./pages/calendar-page.component').then(
            (m) => m.CalendarPageComponent
          ),
      },
      {
        path: 'posts',
        loadComponent: () =>
          import('./pages/post-list-page.component').then(
            (m) => m.PostListPageComponent
          ),
      },
      {
        path: 'posts/new',
        loadComponent: () =>
          import('./pages/post-form.component').then(
            (m) => m.PostFormComponent
          ),
      },
      {
        path: 'posts/:id',
        loadComponent: () =>
          import('./pages/post-detail-page.component').then(
            (m) => m.PostDetailPageComponent
          ),
      },
      {
        path: 'posts/:id/edit',
        loadComponent: () =>
          import('./pages/post-form.component').then(
            (m) => m.PostFormComponent
          ),
      },
      {
        path: 'media',
        loadComponent: () =>
          import('./pages/media-library-page.component').then(
            (m) => m.MediaLibraryPageComponent
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings-page.component').then(
            (m) => m.SettingsPageComponent
          ),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found.component').then((m) => m.NotFoundPageComponent),
  },
];
