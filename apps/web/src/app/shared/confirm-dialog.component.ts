import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/50 transition-opacity"></div>
        <div class="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-modal w-full max-w-sm p-6">
          <div class="flex items-center gap-4 mb-4">
            <div class="shrink-0 w-10 h-10 rounded-full bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center">
              <svg class="h-5 w-5 text-danger-600 dark:text-danger-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{{ title() }}</h3>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ message() }}</p>
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button
              (click)="cancel.emit()"
              class="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              {{ cancelLabel() }}
            </button>
            <button
              (click)="confirm.emit()"
              class="px-4 py-2 text-sm font-medium text-white bg-danger-600 rounded-lg hover:bg-danger-700 transition-colors"
            >
              {{ confirmLabel() }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialogComponent {
  readonly isOpen = input(false);
  readonly title = input('Confirm Delete');
  readonly message = input('Are you sure you want to delete this item? This action cannot be undone.');
  readonly confirmLabel = input('Delete');
  readonly cancelLabel = input('Cancel');
  readonly confirm = output<void>();
  readonly cancel = output<void>();
}
