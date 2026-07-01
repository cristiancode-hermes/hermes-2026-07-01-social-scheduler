import { Component, input, output, signal, HostListener, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { DarkModeService } from '../services/dark-mode.service';
import { RouterLink } from '@angular/router';
import { SearchModalComponent } from '../shared/search-modal.component';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [RouterLink, SearchModalComponent],
  template: `
    <header class="h-16 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4 lg:px-6">
      <div class="flex items-center gap-4">
        <button
          (click)="toggleSidebar.emit()"
          class="lg:hidden p-2 -ml-2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
          type="button"
        >
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <a routerLink="/dashboard" class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <svg class="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
            </svg>
          </div>
          <span class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 hidden sm:block">Social Scheduler</span>
        </a>
      </div>

      <div class="flex items-center gap-3">
        <button
          (click)="searchOpen.set(true)"
          class="flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors w-48 lg:w-64"
        >
          <svg class="h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
          </svg>
          <span class="hidden sm:inline">Search...</span>
          <kbd class="ml-auto hidden lg:inline-flex items-center px-1.5 py-0.5 text-xs text-neutral-400 bg-neutral-200 dark:bg-neutral-700 rounded">Ctrl+K</kbd>
        </button>

        <button
          (click)="darkModeService.toggle()"
          class="p-2 rounded-lg text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          type="button"
          [attr.aria-label]="darkModeService.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          @if (darkModeService.isDark()) {
            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
            </svg>
          } @else {
            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          }
        </button>

        <div class="relative" #userMenu>
          <button
            (click)="userMenuOpen.set(!userMenuOpen())"
            class="flex items-center gap-2 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            type="button"
          >
            <div class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <span class="text-sm font-medium text-primary-700 dark:text-primary-300">
                {{ (authService.currentUser()?.name || 'U').charAt(0).toUpperCase() }}
              </span>
            </div>
            <span class="hidden sm:block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {{ authService.currentUser()?.name || 'User' }}
            </span>
            <svg class="h-4 w-4 text-neutral-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>

          @if (userMenuOpen()) {
            <div
              class="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-900 rounded-xl shadow-dropdown border border-neutral-200 dark:border-neutral-700 py-1 z-50"
            >
              <a routerLink="/settings" class="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                Settings
              </a>
              <hr class="my-1 border-neutral-200 dark:border-neutral-700">
              <button
                (click)="authService.logout()"
                class="w-full text-left px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20"
              >
                Sign out
              </button>
            </div>
          }
        </div>
      </div>

      <app-search-modal
        [isOpen]="searchOpen()"
        (close)="searchOpen.set(false)"
      />
    </header>
  `,
})
export class TopBarComponent {
  readonly authService = inject(AuthService);
  readonly darkModeService = inject(DarkModeService);

  readonly toggleSidebar = output<void>();
  protected readonly searchOpen = signal(false);
  protected readonly userMenuOpen = signal(false);

  @HostListener('document:keydown.control.k', ['$event'])
  onCtrlK(event: Event): void {
    event.preventDefault();
    this.searchOpen.set(true);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.userMenuOpen.set(false);
    }
  }
}
