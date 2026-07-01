import { Component, input, output, computed } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  template: `
    <button
      [disabled]="disabled() || loading()"
      [type]="type()"
      (click)="onClick.emit()"
      class="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      [class]="variantClass() + ' ' + sizeClass()"
    >
      @if (loading()) {
        <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      }
      @if (iconLeft()) {
        <span [innerHTML]="iconLeft()"></span>
      }
      <ng-content />
      @if (iconRight()) {
        <span [innerHTML]="iconRight()"></span>
      }
    </button>
  `,
})
export class ButtonComponent {
  readonly variant = input<'primary' | 'secondary' | 'ghost' | 'danger'>('primary');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly loading = input(false);
  readonly disabled = input(false);
  readonly type = input<'button' | 'submit'>('button');
  readonly iconLeft = input<string>('');
  readonly iconRight = input<string>('');
  readonly onClick = output<void>();

  protected readonly variantClass = computed(() => {
    const map: Record<string, string> = {
      primary:
        'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600',
      secondary:
        'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 focus:ring-neutral-500 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700',
      ghost:
        'bg-transparent text-neutral-600 hover:bg-neutral-100 focus:ring-neutral-500 dark:text-neutral-300 dark:hover:bg-neutral-800',
      danger:
        'bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-500',
    };
    return map[this.variant()] || map['primary'];
  });

  protected readonly sizeClass = computed(() => {
    const map: Record<string, string> = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };
    return map[this.size()] || map['md'];
  });
}
