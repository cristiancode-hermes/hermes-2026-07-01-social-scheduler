import { Component, signal, effect, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MediaService } from '../services/media.service';
import { ButtonComponent } from '../shared/button.component';
import { ModalComponent } from '../shared/modal.component';
import { EmptyStateComponent } from '../shared/empty-state.component';
import { LoadingSkeletonComponent } from '../shared/loading-skeleton.component';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import type { Media } from '../models';

@Component({
  selector: 'app-media-library-page',
  standalone: true,
  imports: [DatePipe, ButtonComponent, ModalComponent, EmptyStateComponent, LoadingSkeletonComponent, ConfirmDialogComponent],
  template: `
    <div class="p-4 lg:p-6 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Media Library</h1>
          <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Upload and manage your images</p>
        </div>
      </div>

      <!-- Upload Zone -->
      <div
        class="relative bg-white dark:bg-neutral-900 rounded-xl shadow-card p-8 text-center border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-primary-400 dark:hover:border-primary-500 transition-colors cursor-pointer"
        (click)="fileInput.click()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        [class.border-primary-500]="isDragOver()"
        [class.bg-primary-50]="isDragOver()"
        [class.dark:bg-primary-900/10]="isDragOver()"
      >
        <input
          #fileInput
          type="file"
          accept="image/*"
          class="hidden"
          (change)="onFileSelected($event)"
          multiple
        />
        <svg class="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Drag and drop images here, or click to browse
        </p>
        <p class="text-xs text-neutral-400 mt-1">PNG, JPG, GIF up to 10MB</p>
      </div>

      @if (mediaService.error()) {
        <div class="p-3 rounded-lg bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800">
          <p class="text-sm text-danger-700 dark:text-danger-300">{{ mediaService.error() }}</p>
        </div>
      }

      <!-- Media Grid -->
      @if (mediaService.loading() && mediaService.mediaList().length === 0) {
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          @for (i of [1,2,3,4,5,6,7,8]; track i) {
            <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-card overflow-hidden animate-pulse">
              <div class="aspect-square bg-neutral-200 dark:bg-neutral-700"></div>
              <div class="p-3">
                <div class="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-2"></div>
                <div class="h-2 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
              </div>
            </div>
          }
        </div>
      } @else if (mediaService.mediaList().length === 0) {
        <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-card">
          <app-empty-state
            title="No media yet"
            description="Upload images to use in your posts"
          />
        </div>
      } @else {
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          @for (item of mediaService.mediaList(); track item.id) {
            <div
              class="bg-white dark:bg-neutral-900 rounded-xl shadow-card overflow-hidden group cursor-pointer hover:shadow-md transition-shadow"
              (click)="previewItem.set(item)"
            >
              <div class="aspect-square overflow-hidden">
                <img
                  [src]="item.url"
                  [alt]="item.originalName"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div class="p-3">
                <p class="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate">{{ item.originalName }}</p>
                <p class="text-xs text-neutral-400 mt-1">{{ (item.size / 1024).toFixed(0) }} KB</p>
              </div>
            </div>
          }
        </div>
      }

      <!-- Preview Modal -->
      <app-modal [isOpen]="previewItem() !== null" (close)="previewItem.set(null)" [title]="previewItem()?.originalName || ''" size="lg">
        @if (previewItem(); as item) {
          <div class="space-y-4">
            <img
              [src]="item.url"
              [alt]="item.originalName"
              class="w-full rounded-lg border border-neutral-200 dark:border-neutral-700"
            />
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-neutral-500">Name:</span>
                <span class="text-neutral-700 dark:text-neutral-300 ml-2">{{ item.originalName }}</span>
              </div>
              <div>
                <span class="text-neutral-500">Size:</span>
                <span class="text-neutral-700 dark:text-neutral-300 ml-2">{{ (item.size / 1024).toFixed(0) }} KB</span>
              </div>
              <div>
                <span class="text-neutral-500">Dimensions:</span>
                <span class="text-neutral-700 dark:text-neutral-300 ml-2">{{ item.width }} × {{ item.height }}</span>
              </div>
              <div>
                <span class="text-neutral-500">Uploaded:</span>
                <span class="text-neutral-700 dark:text-neutral-300 ml-2">{{ item.createdAt | date:'MMM d, yyyy' }}</span>
              </div>
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <app-button variant="danger" size="sm" (onClick)="showDeleteConfirm.set(true)">
                Delete
              </app-button>
            </div>
          </div>
        }
      </app-modal>

      <app-confirm-dialog
        [isOpen]="showDeleteConfirm()"
        title="Delete Media"
        message="Are you sure you want to delete this media file? This action cannot be undone."
        (confirm)="confirmDelete()"
        (cancel)="showDeleteConfirm.set(false)"
      />
    </div>
  `,
})
export class MediaLibraryPageComponent {
  protected readonly mediaService = inject(MediaService);
  protected readonly previewItem = signal<Media | null>(null);
  protected readonly showDeleteConfirm = signal(false);
  protected readonly isDragOver = signal(false);

  constructor() {
    effect(() => {
      this.mediaService.loadMedia();
    });
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith('image/')) {
          this.mediaService.uploadMedia(files[i]);
        }
      }
    }
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      for (let i = 0; i < input.files.length; i++) {
        this.mediaService.uploadMedia(input.files[i]);
      }
    }
    input.value = '';
  }

  protected confirmDelete(): void {
    const item = this.previewItem();
    if (item) {
      this.mediaService.deleteMedia(item.id);
      this.previewItem.set(null);
      this.showDeleteConfirm.set(false);
    }
  }
}
