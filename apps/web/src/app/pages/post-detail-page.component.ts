import { Component, signal, effect, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { PostService } from '../services/post.service';
import { ButtonComponent } from '../shared/button.component';
import { BadgeComponent } from '../shared/badge.component';
import { LoadingSkeletonComponent } from '../shared/loading-skeleton.component';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import { PLATFORM_LABELS, STATUS_LABELS } from '../models';

@Component({
  selector: 'app-post-detail-page',
  standalone: true,
  imports: [DatePipe, RouterLink, ButtonComponent, BadgeComponent, LoadingSkeletonComponent, ConfirmDialogComponent],
  template: `
    <div class="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      @if (postService.loading() && !postService.currentPost()) {
        <div class="space-y-4">
          <app-loading-skeleton variant="card" />
          <app-loading-skeleton variant="card" />
        </div>
      } @else if (postService.error() && !postService.currentPost()) {
        <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-card p-8 text-center">
          <p class="text-danger-600 dark:text-danger-400">{{ postService.error() }}</p>
          <button (click)="loadPost()" class="mt-3 text-sm text-primary-600 hover:underline">Try again</button>
        </div>
      } @else if (post(); as post) {
        <!-- Header -->
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <a routerLink="/posts" class="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
                &larr; Back to Posts
              </a>
            </div>
            <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{{ post.title }}</h1>
            <div class="flex items-center gap-3 mt-2">
              <app-badge [variant]="post.status">{{ STATUS_LABELS[post.status] }}</app-badge>
              @if (post.platformProfile) {
                <app-badge [variant]="post.platformProfile.platform">{{ PLATFORM_LABELS[post.platformProfile.platform] }}</app-badge>
              }
            </div>
          </div>
          <div class="flex items-center gap-2">
            <a [routerLink]="['/posts', post.id, 'edit']">
              <app-button variant="secondary" size="sm">
                <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
                Edit
              </app-button>
            </a>
            <app-button variant="danger" size="sm" (onClick)="showDeleteConfirm.set(true)">
              <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
              Delete
            </app-button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Main Content -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Content Card -->
            <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-card p-6">
              <h2 class="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">Content</h2>
              <p class="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{{ post.content }}</p>
            </div>

            <!-- Media -->
            @if (post.media && post.media.length > 0) {
              <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-card p-6">
                <h2 class="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">Media</h2>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  @for (m of post.media; track m.id) {
                    <img [src]="m.url" [alt]="m.originalName" class="w-full h-32 object-cover rounded-lg border border-neutral-200 dark:border-neutral-700" />
                  }
                </div>
              </div>
            }

            <!-- Version History -->
            <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-card p-6">
              <h2 class="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">Version History</h2>
              <div class="space-y-3">
                <div class="flex items-start gap-3 pl-3 border-l-2 border-primary-500">
                  <div>
                    <p class="text-sm font-medium text-neutral-900 dark:text-neutral-100">Current version</p>
                    <p class="text-xs text-neutral-400">{{ post.updatedAt | date:'MMM d, yyyy h:mm a' }}</p>
                  </div>
                </div>
                <div class="flex items-start gap-3 pl-3 border-l-2 border-neutral-200 dark:border-neutral-700">
                  <div>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400">Created</p>
                    <p class="text-xs text-neutral-400">{{ post.createdAt | date:'MMM d, yyyy h:mm a' }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-card p-6">
              <h2 class="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">Details</h2>
              <dl class="space-y-3">
                <div>
                  <dt class="text-xs text-neutral-500">Status</dt>
                  <dd><app-badge [variant]="post.status">{{ STATUS_LABELS[post.status] }}</app-badge></dd>
                </div>
                @if (post.platformProfile) {
                  <div>
                    <dt class="text-xs text-neutral-500">Platform</dt>
                    <dd class="text-sm text-neutral-700 dark:text-neutral-300">{{ PLATFORM_LABELS[post.platformProfile.platform] }}</dd>
                  </div>
                }
                @if (post.platformProfile) {
                  <div>
                    <dt class="text-xs text-neutral-500">Handle</dt>
                    <dd class="text-sm text-neutral-700 dark:text-neutral-300">@{{ post.platformProfile.handle }}</dd>
                  </div>
                }
                @if (post.scheduledAt) {
                  <div>
                    <dt class="text-xs text-neutral-500">Scheduled</dt>
                    <dd class="text-sm text-neutral-700 dark:text-neutral-300">{{ post.scheduledAt | date:'MMM d, yyyy h:mm a' }}</dd>
                  </div>
                }
                @if (post.publishedAt) {
                  <div>
                    <dt class="text-xs text-neutral-500">Published</dt>
                    <dd class="text-sm text-neutral-700 dark:text-neutral-300">{{ post.publishedAt | date:'MMM d, yyyy h:mm a' }}</dd>
                  </div>
                }
                <div>
                  <dt class="text-xs text-neutral-500">Created</dt>
                  <dd class="text-sm text-neutral-700 dark:text-neutral-300">{{ post.createdAt | date:'MMM d, yyyy' }}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      }

      <app-confirm-dialog
        [isOpen]="showDeleteConfirm()"
        title="Delete Post"
        [message]="'Are you sure you want to delete this post? This action cannot be undone.'"
        (confirm)="onDelete()"
        (cancel)="showDeleteConfirm.set(false)"
      />
    </div>
  `,
})
export class PostDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly postService = inject(PostService);
  protected readonly showDeleteConfirm = signal(false);
  protected readonly PLATFORM_LABELS = PLATFORM_LABELS;
  protected readonly STATUS_LABELS = STATUS_LABELS;

  protected readonly post = this.postService.currentPost;

  constructor() {
    effect(() => {
      this.loadPost();
    });
  }

  protected loadPost(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.postService.loadPost(id);
    }
  }

  protected onDelete(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.postService.deletePost(id);
      this.showDeleteConfirm.set(false);
    }
  }
}
