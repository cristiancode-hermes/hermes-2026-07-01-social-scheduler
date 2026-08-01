import { Component, input, computed } from '@angular/core';
import type { PostStatus, Platform } from '../models';

@Component({
  selector: 'app-badge',
  standalone: true,
  template: `
<span
class="inline-flex items-center px-2.5 py-0.5 rounded-badge text-xs font-medium"
[class]="badgeClass()"
>
<ng-content />
</span>
`,
})
export class BadgeComponent {
  readonly variant = input<PostStatus | Platform | string>('draft');

  protected readonly badgeClass = computed(() => {
    const v = this.variant();
    const statusMap: Record<string, string> = {
      draft: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200',
      scheduled:
        'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200',
      published:
        'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-200',
      failed: 'bg-danger-100 text-danger-700 dark:bg-danger-900 dark:text-danger-200',
    };
    if (statusMap[v]) return statusMap[v];

    const platformMap: Record<string, string> = {
      twitter: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-200',
      linkedin: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
      instagram:
        'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200',
      facebook:
        'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200',
    };
    return platformMap[v] || statusMap['draft'];
  });
}
