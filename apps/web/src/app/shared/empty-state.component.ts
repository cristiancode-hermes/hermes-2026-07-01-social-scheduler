import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
      @if (icon()) {
        <div class="mb-4 text-neutral-300 dark:text-neutral-600" [innerHTML]="icon()"></div>
      } @else {
        <div class="mb-4">
          <svg class="mx-auto h-16 w-16 text-neutral-300 dark:text-neutral-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
      }
      <h3 class="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
        {{ title() }}
      </h3>
      @if (description()) {
        <p class="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mb-6">
          {{ description() }}
        </p>
      }
      @if (actionLabel()) {
        <button
          (click)="action.emit()"
          class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  readonly icon = input<string>('');
  readonly title = input<string>('');
  readonly description = input<string>('');
  readonly actionLabel = input<string>('');
  readonly action = output<void>();
}
