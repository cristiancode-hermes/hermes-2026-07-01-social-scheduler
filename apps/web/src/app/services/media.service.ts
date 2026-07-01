import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Media } from '../models';

@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly http = inject(HttpClient);

  readonly mediaList = signal<Media[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  loadMedia(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<Media[]>('/api/media').subscribe({
      next: (data) => {
        this.mediaList.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load media');
        this.loading.set(false);
      },
    });
  }

  uploadMedia(file: File): void {
    this.loading.set(true);
    this.error.set(null);

    const formData = new FormData();
    formData.append('file', file);

    this.http.post<Media>('/api/media', formData).subscribe({
      next: (media) => {
        this.mediaList.update((list) => [media, ...list]);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to upload media');
        this.loading.set(false);
      },
    });
  }

  deleteMedia(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.delete(`/api/media/${id}`).subscribe({
      next: () => {
        this.mediaList.update((list) => list.filter((m) => m.id !== id));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to delete media');
        this.loading.set(false);
      },
    });
  }
}
