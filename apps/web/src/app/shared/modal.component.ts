import { Component, input, output, computed } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  template: `
@if (isOpen()) {
<div
class="fixed inset-0 z-50 flex items-center justify-center p-4"
(click)="onBackdropClick($event)"
>
<div class="fixed inset-0 bg-black/50 transition-opacity"></div>
<div
class="relative bg-surface-card dark:bg-neutral-900 rounded-2xl -modal w-full transition-all max-h-[90vh] overflow-y-auto"
[class]="sizeClass()"
>
@if (showClose()) {
<button
(click)="close.emit()"
class="absolute top-4 right-4 text-text-secondary-dark hover:text-neutral-600 dark:hover:text-text-primary-dark transition-colors"
type="button"
>
<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
</svg>
</button>
}
@if (title()) {
<div class="px-6 py-4 border-b border-border dark:border-neutral-700">
<h3 class="heading-2 text-text-primary dark:text-text-primary-dark">{{ title() }}</h3>
</div>
}
<div class="p-6">
<ng-content />
</div>
</div>
</div>
}
`,
})
export class ModalComponent {
  readonly isOpen = input(false);
  readonly title = input<string>('');
  readonly size = input<'sm' | 'md' | 'lg' | 'xl'>('md');
  readonly showClose = input(true);
  readonly close = output<void>();

  protected readonly sizeClass = computed(() => {
    const map: Record<string, string> = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
    };
    return map[this.size()] || map['md'];
  });

  protected onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('fixed')) {
      this.close.emit();
    }
  }
}
