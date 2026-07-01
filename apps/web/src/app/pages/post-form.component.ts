import { Component, signal, effect, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { PostService } from '../services/post.service';
import { PlatformService } from '../services/platform.service';
import { MediaService } from '../services/media.service';
import { ButtonComponent } from '../shared/button.component';
import { BadgeComponent } from '../shared/badge.component';
import { ModalComponent } from '../shared/modal.component';
import type { Platform } from '../models';
import { PLATFORM_LABELS, PLATFORM_CHAR_LIMITS } from '../models';

@Component({
  selector: 'app-post-form',
  standalone: true,
  imports: [DatePipe, RouterLink, ButtonComponent, BadgeComponent, ModalComponent],
  template: `
    <div class="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{{ isEdit() ? 'Edit Post' : 'Create Post' }}</h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{{ isEdit() ? 'Update your scheduled post' : 'Create a new social media post' }}</p>
      </div>

      @if (postService.error()) {
        <div class="p-3 rounded-lg bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800">
          <p class="text-sm text-danger-700 dark:text-danger-300">{{ postService.error() }}</p>
        </div>
      }

      <form (ngSubmit)="onSubmit()" class="space-y-6">
        <!-- Platform Selection -->
        <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-card p-6">
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">Platform</label>
          @if (platformService.profiles().length === 0) {
            <div class="text-sm text-neutral-500 dark:text-neutral-400 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              No platform profiles found. Please add a profile in Settings first.
            </div>
          } @else {
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              @for (profile of platformService.profiles(); track profile.id) {
                <button
                  type="button"
                  (click)="selectedProfileId.set(profile.id)"
                  class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all"
                  [class.border-primary-500]="selectedProfileId() === profile.id"
                  [class.bg-primary-50]="selectedProfileId() === profile.id"
                  [class.dark:bg-primary-900/20]="selectedProfileId() === profile.id"
                  [class.border-neutral-200]="selectedProfileId() !== profile.id"
                  [class.dark:border-neutral-700]="selectedProfileId() !== profile.id"
                  [class.hover:border-primary-300]="selectedProfileId() !== profile.id"
                  [class.dark:hover:border-primary-600]="selectedProfileId() !== profile.id"
                >
                  <app-badge [variant]="profile.platform">{{ PLATFORM_LABELS[profile.platform] }}</app-badge>
                  <span class="text-xs text-neutral-500">{{ profile.displayName }}</span>
                </button>
              }
            </div>
          }
        </div>

        <!-- Title -->
        <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-card p-6">
          <label for="title" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Title</label>
          <input
            id="title"
            type="text"
            [value]="title()"
            (input)="title.set($any($event).target.value)"
            class="w-full px-3 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            placeholder="Post title"
            required
          />
        </div>

        <!-- Content -->
        <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-card p-6">
          <div class="flex items-center justify-between mb-2">
            <label for="content" class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Content</label>
            @if (selectedProfile()) {
              <span class="text-xs" [class.text-danger-500]="content().length > charLimit()" [class.text-neutral-400]="content().length <= charLimit()">
                {{ content().length }} / {{ charLimit() }}
              </span>
            }
          </div>
          <textarea
            id="content"
            [value]="content()"
            (input)="content.set($any($event).target.value)"
            rows="6"
            class="w-full px-3 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm resize-y"
            placeholder="What do you want to share?"
          ></textarea>

          <!-- Preview -->
          @if (selectedProfile()) {
            <div class="mt-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <div class="flex items-center gap-2 mb-2">
                <app-badge [variant]="selectedProfile()!.platform">{{ PLATFORM_LABELS[selectedProfile()!.platform] }}</app-badge>
                <span class="text-xs text-neutral-400">Preview</span>
              </div>
              <p class="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{{ content() || 'Your post content will appear here...' }}</p>
            </div>
          }
        </div>

        <!-- Media Selection -->
        <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-card p-6">
          <div class="flex items-center justify-between mb-3">
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Media</label>
            <button
              type="button"
              (click)="mediaModalOpen.set(true)"
              class="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              Browse Media Library
            </button>
          </div>

          @if (selectedMedia().length > 0) {
            <div class="grid grid-cols-4 gap-2">
              @for (media of selectedMedia(); track media.id) {
                <div class="relative group">
                  <img
                    [src]="media.url"
                    [alt]="media.originalName"
                    class="w-full h-24 object-cover rounded-lg border border-neutral-200 dark:border-neutral-700"
                  />
                  <button
                    type="button"
                    (click)="removeMedia(media.id)"
                    class="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg class="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                  </button>
                </div>
              }
            </div>
          } @else {
            <div class="text-sm text-neutral-400 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg text-center">
              No media selected. Click "Browse Media Library" to add images.
            </div>
          }
        </div>

        <!-- Schedule -->
        <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-card p-6">
          <div class="flex items-center justify-between mb-4">
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Schedule</label>
            <button
              type="button"
              (click)="scheduleEnabled.set(!scheduleEnabled())"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              [class.bg-primary-600]="scheduleEnabled()"
              [class.bg-neutral-300]="!scheduleEnabled()"
              [class.dark:bg-neutral-600]="!scheduleEnabled()"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                [class.translate-x-6]="scheduleEnabled()"
                [class.translate-x-1]="!scheduleEnabled()"
              ></span>
            </button>
          </div>

          @if (scheduleEnabled()) {
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label for="schedDate" class="block text-xs font-medium text-neutral-500 mb-1">Date</label>
                <input
                  id="schedDate"
                  type="date"
                  [value]="scheduledDate()"
                  (input)="scheduledDate.set($any($event).target.value)"
                  class="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
              </div>
              <div>
                <label for="schedTime" class="block text-xs font-medium text-neutral-500 mb-1">Time</label>
                <input
                  id="schedTime"
                  type="time"
                  [value]="scheduledTime()"
                  (input)="scheduledTime.set($any($event).target.value)"
                  class="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
              </div>
            </div>
          }
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3">
          <a routerLink="/posts">
            <app-button type="button" variant="ghost">Cancel</app-button>
          </a>
          <app-button
            type="submit"
            variant="secondary"
            [loading]="postService.loading()"
            [disabled]="!title() || !selectedProfileId()"
          >
            Save Draft
          </app-button>
          @if (scheduleEnabled() && scheduledDate()) {
            <app-button
              type="button"
              variant="primary"
              [loading]="postService.loading()"
              [disabled]="!title() || !selectedProfileId()"
              (onClick)="onSchedule()"
            >
              Schedule Post
            </app-button>
          }
        </div>
      </form>

      <!-- Media Library Modal -->
      <app-modal [isOpen]="mediaModalOpen()" (close)="mediaModalOpen.set(false)" title="Media Library" size="xl">
        @if (mediaService.loading()) {
          <div class="flex items-center justify-center py-8">
            <svg class="animate-spin h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        } @else if (mediaService.mediaList().length === 0) {
          <div class="text-center py-8 text-sm text-neutral-400">No media uploaded yet.</div>
        } @else {
          <div class="grid grid-cols-3 sm:grid-cols-4 gap-3">
            @for (m of mediaService.mediaList(); track m.id) {
              <button
                type="button"
                (click)="toggleMediaSelection(m)"
                class="relative group rounded-lg overflow-hidden border-2 transition-all"
                [class.border-primary-500]="isMediaSelected(m.id)"
                [class.border-transparent]="!isMediaSelected(m.id)"
              >
                <img [src]="m.url" [alt]="m.originalName" class="w-full h-24 object-cover" />
                @if (isMediaSelected(m.id)) {
                  <div class="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center">
                    <svg class="h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                  </div>
                }
              </button>
            }
          </div>
        }
      </app-modal>
    </div>
  `,
})
export class PostFormComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly postService = inject(PostService);
  protected readonly platformService = inject(PlatformService);
  protected readonly mediaService = inject(MediaService);
  protected readonly PLATFORM_LABELS = PLATFORM_LABELS;

  protected readonly isEdit = signal(false);
  protected readonly postId = signal<string | null>(null);
  protected readonly title = signal('');
  protected readonly content = signal('');
  protected readonly selectedProfileId = signal('');
  protected readonly scheduleEnabled = signal(false);
  protected readonly scheduledDate = signal('');
  protected readonly scheduledTime = signal('');
  protected readonly mediaModalOpen = signal(false);
  protected readonly selectedMediaIds = signal<string[]>([]);

  protected readonly selectedMedia = computed(() => {
    return this.mediaService.mediaList().filter((m) => this.selectedMediaIds().includes(m.id));
  });

  protected readonly selectedProfile = computed(() => {
    return this.platformService.profiles().find((p) => p.id === this.selectedProfileId()) || null;
  });

  protected readonly charLimit = computed(() => {
    const profile = this.selectedProfile();
    if (!profile) return Infinity;
    return PLATFORM_CHAR_LIMITS[profile.platform];
  });

  constructor() {
    this.platformService.loadProfiles();
    this.mediaService.loadMedia();

    effect(() => {
      const id = this.route.snapshot.params['id'];
      if (id) {
        this.isEdit.set(true);
        this.postId.set(id);
        this.postService.loadPost(id);
        const post = this.postService.currentPost();
        if (post) {
          this.title.set(post.title);
          this.content.set(post.content);
          this.selectedProfileId.set(post.platformProfileId);
          this.selectedMediaIds.set(post.mediaIds || []);
          if (post.scheduledAt) {
            this.scheduleEnabled.set(true);
            const d = new Date(post.scheduledAt);
            this.scheduledDate.set(d.toISOString().split('T')[0]);
            this.scheduledTime.set(d.toTimeString().slice(0, 5));
          }
        }
      }
    });
  }

  protected isMediaSelected(id: string): boolean {
    return this.selectedMediaIds().includes(id);
  }

  protected toggleMediaSelection(media: any): void {
    this.selectedMediaIds.update((ids) => {
      if (ids.includes(media.id)) {
        return ids.filter((i) => i !== media.id);
      }
      return [...ids, media.id];
    });
  }

  protected removeMedia(id: string): void {
    this.selectedMediaIds.update((ids) => ids.filter((i) => i !== id));
  }

  protected onSubmit(): void {
    if (this.isEdit()) {
      this.postService.updatePost(this.postId()!, {
        title: this.title(),
        content: this.content(),
        platformProfileId: this.selectedProfileId(),
        mediaIds: this.selectedMediaIds(),
      });
    } else {
      this.postService.createPost({
        title: this.title(),
        content: this.content(),
        platformProfileId: this.selectedProfileId(),
        mediaIds: this.selectedMediaIds(),
      });
    }
    this.router.navigate(['/posts']);
  }

  protected onSchedule(): void {
    const scheduledAt = `${this.scheduledDate()}T${this.scheduledTime() || '12:00'}:00`;
    if (this.isEdit()) {
      this.postService.updatePost(this.postId()!, {
        title: this.title(),
        content: this.content(),
        platformProfileId: this.selectedProfileId(),
        scheduledAt,
        mediaIds: this.selectedMediaIds(),
      });
    } else {
      this.postService.createPost({
        title: this.title(),
        content: this.content(),
        platformProfileId: this.selectedProfileId(),
        scheduledAt,
        mediaIds: this.selectedMediaIds(),
      });
    }
    this.router.navigate(['/posts']);
  }
}
