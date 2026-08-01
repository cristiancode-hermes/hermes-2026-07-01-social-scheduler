import { Component, input, output, signal, effect, computed } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
@if (visible()) {
<div
class="flex items-center gap-3 px-4 py-3 rounded-btn border pointer-events-auto transition-all duration-300"
[class]="toastClass()"
role="alert"
>
@if (type() === 'success') {
<svg class="h-5 w-5 shrink-0 text-success-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
</svg>
}
@if (type() === 'error') {
<svg class="h-5 w-5 shrink-0 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
</svg>
}
@if (type() === 'info') {
<svg class="h-5 w-5 shrink-0 text-primary-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
</svg>
}
<span class="text-sm font-medium">{{ message() }}</span>
<button
(click)="dismiss.emit()"
class="ml-auto shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
type="button"
>
<svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
</svg>
</button>
</div>
}
`,
})
export class ToastComponent {
  readonly type = input<ToastType>('info');
  readonly message = input<string>('');
  readonly duration = input<number>(5000);
  readonly visible = signal(true);
  readonly dismiss = output<void>();

  constructor() {
    effect(() => {
      if (this.visible() && this.duration() > 0) {
        const timer = setTimeout(() => {
          this.dismiss.emit();
        }, this.duration());
        return () => clearTimeout(timer);
      }
      return;
    });
  }

  protected readonly toastClass = computed(() => {
    const map: Record<string, string> = {
      success:
        'bg-success-50 border-success-200 text-success-800 dark:bg-success-900/20 dark:border-success-800 dark:text-success-200',
      error:
        'bg-danger-50 border-danger-200 text-danger-800 dark:bg-danger-900/20 dark:border-danger-800 dark:text-danger-200',
      info:
        'bg-primary-50 border-primary-200 text-primary-800 dark:bg-primary-900/20 dark:border-primary-800 dark:text-primary-200',
    };
    return map[this.type()] || map['info'];
  });
}
