import { Component, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ButtonComponent } from '../shared/button.component';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [RouterLink, ButtonComponent],
  template: `
<div class="min-h-screen bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center p-4">
<div class="w-full max-w-md">
<div class="bg-surface-card dark:bg-neutral-900 rounded-2xl -modal p-8">
<div class="text-center mb-8">
<div class="w-12 h-12 rounded-card bg-accent flex items-center justify-center mx-auto mb-4">
<svg class="h-7 w-7 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
<path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
</svg>
</div>
<h1 class="heading-1 text-text-primary dark:text-text-primary-dark">Create account</h1>
<p class="text-sm text-text-secondary dark:text-text-secondary-dark mt-1">Get started with Social Scheduler</p>
</div>

<form (ngSubmit)="onRegister()" class="space-y-4">
<div>
<label for="name" class="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-1">Full Name</label>
<input
id="name"
type="text"
[value]="name()"
(input)="name.set($any($event).target.value)"
class="w-full px-3 py-2.5 rounded-btn border border-border dark:border-neutral-700 bg-surface-card dark:bg-neutral-800 text-text-primary dark:text-text-primary-dark placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-sm"
placeholder="John Doe"
required
/>
</div>

<div>
<label for="email" class="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-1">Email</label>
<input
id="email"
type="email"
[value]="email()"
(input)="email.set($any($event).target.value)"
class="w-full px-3 py-2.5 rounded-btn border border-border dark:border-neutral-700 bg-surface-card dark:bg-neutral-800 text-text-primary dark:text-text-primary-dark placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-sm"
placeholder="you@example.com"
required
autocomplete="email"
/>
</div>

<div>
<label for="orgName" class="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-1">Organization Name</label>
<input
id="orgName"
type="text"
[value]="orgName()"
(input)="orgName.set($any($event).target.value)"
class="w-full px-3 py-2.5 rounded-btn border border-border dark:border-neutral-700 bg-surface-card dark:bg-neutral-800 text-text-primary dark:text-text-primary-dark placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-sm"
placeholder="My Company"
required
/>
</div>

<div>
<label for="password" class="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-1">Password</label>
<input
id="password"
type="password"
[value]="password()"
(input)="password.set($any($event).target.value)"
class="w-full px-3 py-2.5 rounded-btn border border-border dark:border-neutral-700 bg-surface-card dark:bg-neutral-800 text-text-primary dark:text-text-primary-dark placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-sm"
placeholder="Min. 8 characters"
required
autocomplete="new-password"
/>
</div>

@if (authService.error()) {
<div class="p-3 rounded-btn bg-red-50 dark:bg-red-950/20 border border-danger-200 dark:border-danger-800">
<p class="text-sm text-red-700 dark:text-danger-300">{{ authService.error() }}</p>
</div>
}

<app-button
type="submit"
variant="primary"
class="w-full"
[loading]="authService.isLoading()"
[disabled]="!name() || !email() || !password() || !orgName()"
>
Create account
</app-button>
</form>

<p class="text-center text-sm text-text-secondary dark:text-text-secondary-dark mt-6">
Already have an account?
<a routerLink="/login" class="text-accent dark:text-accent font-medium hover:underline">Sign in</a>
</p>
</div>
</div>
</div>
`,
})
export class RegisterPageComponent {
  protected readonly authService = inject(AuthService);
  protected readonly name = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly orgName = signal('');

  protected onRegister(): void {
    this.authService.register({
      name: this.name(),
      email: this.email(),
      password: this.password(),
      organizationName: this.orgName(),
    });
  }
}
