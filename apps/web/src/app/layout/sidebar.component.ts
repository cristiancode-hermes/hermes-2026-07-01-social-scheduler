import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: '<svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>',
  },
  {
    path: '/calendar',
    label: 'Calendar',
    icon: '<svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 8h12v8H4V8z" clip-rule="evenodd"/></svg>',
  },
  {
    path: '/posts',
    label: 'Posts',
    icon: '<svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/></svg>',
  },
  {
    path: '/media',
    label: 'Media',
    icon: '<svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/></svg>',
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: '<svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/></svg>',
  },
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
<aside
class="fixed lg:static inset-y-0 left-0 z-40 w-64 bg-surface-card dark:bg-neutral-900 border-r border-border dark:border-neutral-800 flex flex-col transition-transform duration-200"
[class.-translate-x-full]="!open()"
[class.translate-x-0]="open()"
>
<div class="h-16"></div>
<nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
@for (item of navItems; track item.path) {
<a
[routerLink]="item.path"
routerLinkActive="bg-accent-light text-accent dark:bg-accent-light dark:text-primary-300"
[routerLinkActiveOptions]="{exact: item.path === '/dashboard'}"
class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-btn text-neutral-600 dark:text-text-secondary-dark hover:bg-surface dark:hover:bg-neutral-800 hover:text-text-primary dark:hover:text-text-primary-dark transition-colors"
(click)="navigate.emit()"
>
<span [innerHTML]="item.icon"></span>
{{ item.label }}
</a>
}
</nav>

<div class="p-4 border-t border-border dark:border-neutral-800">
<div class="flex items-center gap-3 px-3 py-2">
<div class="text-xs text-text-secondary-dark">
Social Scheduler v1.0
</div>
</div>
</div>
</aside>
`,
})
export class SidebarComponent {
  readonly open = input(false);
  readonly navigate = output<void>();

  protected readonly navItems = NAV_ITEMS;
}
