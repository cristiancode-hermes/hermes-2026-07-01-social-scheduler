import { Component, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ButtonComponent } from '../shared/button.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [RouterLink, ButtonComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <div class="bg-white dark:bg-neutral-900 rounded-2xl shadow-modal p-8">
          <div class="text-center mb-8">
            <div class="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center mx-auto mb-4">
              <svg class="h-7 w-7 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
              </svg>
            </div>
            <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Welcome back</h1>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Sign in to your account</p>
          </div>

          <form (ngSubmit)="onLogin()" class="space-y-4">
            <div>
              <label for="email" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Email</label>
              <input
                id="email"
                type="email"
                [value]="email()"
                (input)="email.set($any($event).target.value)"
                class="w-full px-3 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                placeholder="you@example.com"
                required
                autocomplete="email"
              />
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Password</label>
              <input
                id="password"
                type="password"
                [value]="password()"
                (input)="password.set($any($event).target.value)"
                class="w-full px-3 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                placeholder="••••••••"
                required
                autocomplete="current-password"
              />
            </div>

            @if (authService.error()) {
              <div class="p-3 rounded-lg bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800">
                <p class="text-sm text-danger-700 dark:text-danger-300">{{ authService.error() }}</p>
              </div>
            }

            <app-button
              type="submit"
              variant="primary"
              class="w-full"
              [loading]="authService.isLoading()"
              [disabled]="!email() || !password()"
            >
              Sign in
            </app-button>
          </form>

          <p class="text-center text-sm text-neutral-500 dark:text-neutral-400 mt-6">
            Don't have an account?
            <a routerLink="/register" class="text-primary-600 dark:text-primary-400 font-medium hover:underline">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class LoginPageComponent {
  protected readonly authService = inject(AuthService);
  protected readonly email = signal('');
  protected readonly password = signal('');

  protected onLogin(): void {
    this.authService.login({
      email: this.email(),
      password: this.password(),
    });
  }
}
