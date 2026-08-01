import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  template: `
@switch (variant()) {
@case ('card') {
<div class="bg-surface-card dark:bg-neutral-900 rounded-card -card p-6 animate-pulse">
<div class="h-4 bg-border dark:bg-neutral-700 rounded w-3/4 mb-4"></div>
<div class="h-3 bg-border dark:bg-neutral-700 rounded w-1/2 mb-3"></div>
<div class="h-3 bg-border dark:bg-neutral-700 rounded w-full mb-2"></div>
<div class="h-3 bg-border dark:bg-neutral-700 rounded w-5/6"></div>
</div>
}
@case ('row') {
<div class="flex items-center gap-4 p-4 animate-pulse">
<div class="h-10 w-10 rounded-badge bg-border dark:bg-neutral-700"></div>
<div class="flex-1">
<div class="h-3 bg-border dark:bg-neutral-700 rounded w-1/3 mb-2"></div>
<div class="h-3 bg-border dark:bg-neutral-700 rounded w-1/4"></div>
</div>
</div>
}
@case ('chart') {
<div class="bg-surface-card dark:bg-neutral-900 rounded-card -card p-6 animate-pulse">
<div class="h-4 bg-border dark:bg-neutral-700 rounded w-1/4 mb-6"></div>
<div class="flex items-end gap-3 h-40">
@for (bar of [1,2,3,4]; track bar) {
<div
class="flex-1 bg-border dark:bg-neutral-700 rounded-t-lg"
[style.height]="(30 + bar * 20) + '%'"
></div>
}
</div>
</div>
}
@default {
<div class="space-y-3 animate-pulse">
<div class="h-3 bg-border dark:bg-neutral-700 rounded w-full"></div>
<div class="h-3 bg-border dark:bg-neutral-700 rounded w-5/6"></div>
<div class="h-3 bg-border dark:bg-neutral-700 rounded w-4/6"></div>
</div>
}
}
`,
})
export class LoadingSkeletonComponent {
  readonly variant = input<'card' | 'row' | 'chart' | 'text'>('text');
  readonly count = input(1);
}
