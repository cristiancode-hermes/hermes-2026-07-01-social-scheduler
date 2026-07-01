import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Post, PlatformProfile, Media } from '../models';

export interface SearchResults {
  posts: Post[];
  profiles: PlatformProfile[];
  media: Media[];
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly http = inject(HttpClient);

  readonly results = signal<SearchResults | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  search(query: string): void {
    if (!query.trim()) {
      this.results.set(null);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.http
      .get<SearchResults>(`/api/search?q=${encodeURIComponent(query)}`)
      .subscribe({
        next: (data) => {
          this.results.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Search failed');
          this.loading.set(false);
        },
      });
  }

  clear(): void {
    this.results.set(null);
    this.loading.set(false);
    this.error.set(null);
  }
}
