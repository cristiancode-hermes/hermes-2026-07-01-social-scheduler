import { Component, signal, effect, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PostService } from '../services/post.service';
import { ButtonComponent } from '../shared/button.component';
import { BadgeComponent } from '../shared/badge.component';
import { EmptyStateComponent } from '../shared/empty-state.component';
import { LoadingSkeletonComponent } from '../shared/loading-skeleton.component';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import type { Platform, PostStatus } from '../models';
import { PLATFORM_LABELS, STATUS_LABELS } from '../models';

@Component({
  selector: 'app-post-list-page',
  standalone: true,
  imports: [DatePipe, RouterLink, ButtonComponent, BadgeComponent, EmptyStateComponent, LoadingSkeletonComponent, ConfirmDialogComponent],
  template: `
<div class="p-4 lg:p-6 space-y-6">
<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
<div>
<h1 class="heading-1 text-text-primary dark:text-text-primary-dark">Posts</h1>
<p class="text-sm text-text-secondary dark:text-text-secondary-dark mt-1">Manage your social media content</p>
</div>
<div class="flex items-center gap-2">
<button (click)="exportCsv()" class="inline-flex items-center gap-2 rounded-card border border-surface-300 dark:border-neutral-700 px-4 py-2 text-sm font-medium text-text-primary dark:text-text-primary-dark hover:border-primary-500 hover:text-primary-600 transition-colors">
⬇️ Export CSV
</button>
<a routerLink="/posts/new">
<app-button variant="primary">
<svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/></svg>
New Post
</app-button>
</a>
</div>
</div>

<!-- Filters -->
<div class="bg-surface-card dark:bg-neutral-900 rounded-card -card p-4">
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
<div>
<input
[value]="searchQuery()"
(input)="searchQuery.set($any($event).target.value); onFilterChange()"
type="text"
placeholder="Search posts..."
class="w-full px-3 py-2 rounded-btn border border-border dark:border-neutral-700 bg-surface-card dark:bg-neutral-800 text-text-primary dark:text-text-primary-dark placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent text-sm"
/>
</div>
<div>
<select
[value]="platformFilter()"
(change)="platformFilter.set($any($event).target.value); onFilterChange()"
class="w-full px-3 py-2 rounded-btn border border-border dark:border-neutral-700 bg-surface-card dark:bg-neutral-800 text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-accent text-sm"
>
<option value="">All Platforms</option>
@for (p of platformOptions; track p.value) {
<option [value]="p.value">{{ p.label }}</option>
}
</select>
</div>
<div>
<select
[value]="statusFilter()"
(change)="statusFilter.set($any($event).target.value); onFilterChange()"
class="w-full px-3 py-2 rounded-btn border border-border dark:border-neutral-700 bg-surface-card dark:bg-neutral-800 text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-accent text-sm"
>
<option value="">All Statuses</option>
@for (s of statusOptions; track s.value) {
<option [value]="s.value">{{ s.label }}</option>
}
</select>
</div>
<div class="flex gap-2">
<input
[value]="dateFrom()"
(input)="dateFrom.set($any($event).target.value); onFilterChange()"
type="date"
class="flex-1 px-3 py-2 rounded-btn border border-border dark:border-neutral-700 bg-surface-card dark:bg-neutral-800 text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-accent text-sm"
/>
<input
[value]="dateTo()"
(input)="dateTo.set($any($event).target.value); onFilterChange()"
type="date"
class="flex-1 px-3 py-2 rounded-btn border border-border dark:border-neutral-700 bg-surface-card dark:bg-neutral-800 text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-accent text-sm"
/>
</div>
</div>
</div>

<!-- Posts List -->
@if (postService.loading() && postService.posts().length === 0) {
<div class="space-y-3">
@for (i of [1,2,3,4,5]; track i) {
<app-loading-skeleton variant="row" />
}
</div>
} @else if (postService.error() && postService.posts().length === 0) {
<div class="bg-surface-card dark:bg-neutral-900 rounded-card -card p-8 text-center">
<p class="text-red-600 dark:text-red-400">{{ postService.error() }}</p>
<button (click)="loadPosts()" class="mt-3 text-sm text-accent hover:underline">Try again</button>
</div>
} @else if (postService.posts().length === 0) {
<div class="bg-surface-card dark:bg-neutral-900 rounded-card -card">
<app-empty-state
title="No posts yet"
description="Create your first post to start scheduling content"
[actionLabel]="'Create Post'"
(action)="createPost()"
/>
</div>
} @else {
<div class="bg-surface-card dark:bg-neutral-900 rounded-card -card overflow-hidden">
<div class="overflow-x-auto">
<table class="w-full">
<thead>
<tr class="border-b border-border dark:border-neutral-800">
<th class="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Title</th>
<th class="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Platform</th>
<th class="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
<th class="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Scheduled</th>
<th class="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Actions</th>
</tr>
</thead>
<tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
@for (post of postService.posts(); track post.id) {
<tr class="hover:bg-surface dark:hover:bg-neutral-800/50 transition-colors">
<td class="px-4 py-3">
<a [routerLink]="['/posts', post.id]" class="text-sm font-medium text-text-primary dark:text-text-primary-dark hover:text-accent dark:hover:text-accent">
{{ post.title }}
</a>
</td>
<td class="px-4 py-3">
@if (post.platformProfile) {
<app-badge [variant]="post.platformProfile.platform">{{ PLATFORM_LABELS[post.platformProfile.platform] }}</app-badge>
}
</td>
<td class="px-4 py-3">
<app-badge [variant]="post.status">{{ STATUS_LABELS[post.status] }}</app-badge>
</td>
<td class="px-4 py-3">
<span class="text-sm text-text-secondary dark:text-text-secondary-dark">
@if (post.scheduledAt) {
{{ post.scheduledAt | date:'MMM d, yyyy' }}
} @else {
-
}
</span>
</td>
<td class="px-4 py-3 text-right">
<div class="flex items-center justify-end gap-2">
<a [routerLink]="['/posts', post.id, 'edit']" class="p-1.5 rounded-btn hover:bg-surface dark:hover:bg-neutral-700 text-text-secondary-dark hover:text-neutral-600 dark:hover:text-text-primary-dark transition-colors">
<svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
</a>
<button
(click)="deleteTarget.set(post)"
class="p-1.5 rounded-btn hover:bg-red-50 dark:hover:bg-red-950/20 text-text-secondary-dark hover:text-red-600 transition-colors"
>
<svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
</button>
</div>
</td>
</tr>
}
</tbody>
</table>
</div>

<!-- Pagination -->
@if (totalPages() > 1) {
<div class="flex items-center justify-between px-4 py-3 border-t border-border dark:border-neutral-800">
<span class="text-sm text-text-secondary dark:text-text-secondary-dark">
Page {{ currentPage() }} of {{ totalPages() }}
</span>
<div class="flex gap-1">
<button
(click)="goToPage(currentPage() - 1)"
[disabled]="currentPage() <= 1"
class="px-3 py-1.5 text-sm rounded-btn border border-border dark:border-neutral-700 disabled:opacity-50 hover:bg-surface dark:hover:bg-neutral-800 transition-colors"
>
Previous
</button>
<button
(click)="goToPage(currentPage() + 1)"
[disabled]="currentPage() >= totalPages()"
class="px-3 py-1.5 text-sm rounded-btn border border-border dark:border-neutral-700 disabled:opacity-50 hover:bg-surface dark:hover:bg-neutral-800 transition-colors"
>
Next
</button>
</div>
</div>
}
</div>
}

<!-- Delete Confirmation -->
<app-confirm-dialog
[isOpen]="deleteTarget() !== null"
title="Delete Post"
[message]="'Are you sure you want to delete ' + (deleteTarget()?.title || '') + '? This action cannot be undone.'"
(confirm)="confirmDelete()"
(cancel)="deleteTarget.set(null)"
/>
</div>
`,
})
export class PostListPageComponent {
  protected readonly postService = inject(PostService);
  protected readonly PLATFORM_LABELS = PLATFORM_LABELS;
  protected readonly STATUS_LABELS = STATUS_LABELS;

  protected readonly searchQuery = signal('');
  protected readonly platformFilter = signal<string>('');
  protected readonly statusFilter = signal<string>('');
  protected readonly dateFrom = signal('');
  protected readonly dateTo = signal('');
  protected readonly currentPage = signal(1);
  protected readonly deleteTarget = signal<any>(null);

  protected readonly platformOptions: { value: string; label: string }[] = [
    { value: 'twitter', label: 'Twitter' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'facebook', label: 'Facebook' },
  ];

  protected readonly statusOptions: { value: string; label: string }[] = [
    { value: 'draft', label: 'Draft' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'published', label: 'Published' },
    { value: 'failed', label: 'Failed' },
  ];

  constructor() {
    effect(() => {
      this.loadPosts();
    });
  }

  protected loadPosts(): void {
    this.postService.loadPosts({
      search: this.searchQuery() || undefined,
      platform: (this.platformFilter() as Platform) || undefined,
      status: (this.statusFilter() as PostStatus) || undefined,
      dateFrom: this.dateFrom() || undefined,
      dateTo: this.dateTo() || undefined,
      page: this.currentPage(),
      limit: 10,
    });
  }

  protected totalPages(): number {
    return Math.max(1, Math.ceil(this.postService.total() / 10));
  }

  protected onFilterChange(): void {
    this.currentPage.set(1);
  }

  protected exportCsv(): void {
    this.postService.exportCsv({
      search: this.searchQuery() || undefined,
      platform: (this.platformFilter() as Platform) || undefined,
      status: (this.statusFilter() as PostStatus) || undefined,
      dateFrom: this.dateFrom() || undefined,
      dateTo: this.dateTo() || undefined,
    });
  }

  protected goToPage(page: number): void {
    this.currentPage.set(page);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (target) {
      this.postService.deletePost(target.id);
      this.deleteTarget.set(null);
    }
  }

  protected createPost(): void {
    window.location.href = '/posts/new';
  }
}
