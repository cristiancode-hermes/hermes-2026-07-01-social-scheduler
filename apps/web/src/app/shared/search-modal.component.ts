import { Component, input, output, signal, effect, HostListener, ElementRef, viewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BadgeComponent } from '../shared/badge.component';
import { SearchService } from '../services/search.service';

@Component({
  selector: 'app-search-modal',
  standalone: true,
  imports: [BadgeComponent],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
        <div class="fixed inset-0 bg-black/50" (click)="close.emit()"></div>
        <div
          class="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-modal w-full max-w-lg mx-4 transition-all"
          #searchPanel
        >
          <div class="flex items-center gap-3 px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
            <svg class="h-5 w-5 text-neutral-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
            </svg>
            <input
              #searchInput
              [value]="query()"
              (input)="query.set($any($event).target.value); onSearch()"
              type="text"
              placeholder="Search posts, profiles, media..."
              class="flex-1 bg-transparent border-none outline-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 text-sm"
            />
            <kbd class="hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded">ESC</kbd>
          </div>

          <div class="max-h-80 overflow-y-auto p-2">
            @if (loading()) {
              <div class="flex items-center justify-center py-8">
                <svg class="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            } @else if (results() && (results()!.posts.length > 0 || results()!.profiles.length > 0 || results()!.media.length > 0)) {
              @if (results()!.posts.length > 0) {
                <div class="px-2 py-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Posts</div>
                @for (post of results()!.posts; track post.id) {
                  <button
                    (click)="navigateTo('/posts/' + post.id)"
                    class="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition-colors"
                  >
                    <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate flex-1">{{ post.title }}</span>
                    <app-badge [variant]="post.status">{{ post.status }}</app-badge>
                  </button>
                }
              }
              @if (results()!.profiles.length > 0) {
                <div class="px-2 py-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider mt-1">Profiles</div>
                @for (profile of results()!.profiles; track profile.id) {
                  <button class="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition-colors">
                    <app-badge [variant]="profile.platform">{{ profile.platform }}</app-badge>
                    <span class="text-sm text-neutral-700 dark:text-neutral-300">{{ profile.displayName }}</span>
                    <span class="text-xs text-neutral-400">@{{ profile.handle }}</span>
                  </button>
                }
              }
              @if (results()!.media.length > 0) {
                <div class="px-2 py-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider mt-1">Media</div>
                @for (item of results()!.media; track item.id) {
                  <button class="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition-colors">
                    <span class="text-sm text-neutral-700 dark:text-neutral-300 truncate flex-1">{{ item.originalName }}</span>
                    <span class="text-xs text-neutral-400">{{ (item.size / 1024).toFixed(0) }} KB</span>
                  </button>
                }
              }
            } @else if (query().length > 0) {
              <div class="text-center py-8 text-sm text-neutral-400">
                No results found for "{{ query() }}"
              </div>
            } @else {
              <div class="text-center py-8 text-sm text-neutral-400">
                Start typing to search...
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [],
})
export class SearchModalComponent {
  private readonly searchService = inject(SearchService);
  private readonly router = inject(Router);

  readonly isOpen = input(false);
  readonly close = output<void>();

  readonly query = signal('');
  protected readonly results = this.searchService.results;
  protected readonly loading = this.searchService.loading;

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        setTimeout(() => {
          this.searchInput()?.nativeElement?.focus();
        }, 100);
      } else {
        this.query.set('');
        this.searchService.clear();
      }
    });
  }

  @HostListener('keydown.escape')
  onEscape(): void {
    this.close.emit();
  }

  protected onSearch(): void {
    this.searchService.search(this.query());
  }

  protected navigateTo(path: string): void {
    this.close.emit();
    this.router.navigateByUrl(path);
  }
}
