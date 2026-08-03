import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type {
  Post,
  CreatePostRequest,
  UpdatePostRequest,
  PostFilters,
  PaginatedResponse,
} from '../models';

@Injectable({ providedIn: 'root' })
export class PostService {
  private readonly http = inject(HttpClient);

  readonly posts = signal<Post[]>([]);
  readonly total = signal(0);
  readonly currentPost = signal<Post | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly calendarPosts = signal<Post[]>([]);

  loadPosts(filters: PostFilters = {}): void {
    this.loading.set(true);
    this.error.set(null);

    const params = new URLSearchParams();
    if (filters.search) params.set('q', filters.search);
    if (filters.platform) params.set('platform', filters.platform);
    if (filters.status) params.set('status', filters.status);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));

    this.http
      .get<PaginatedResponse<Post>>(`/api/posts?${params.toString()}`)
      .subscribe({
        next: (res) => {
          this.posts.set(res.data);
          this.total.set(res.total);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to load posts');
          this.loading.set(false);
        },
      });
  }

  loadCalendarPosts(month: number, year: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.http
      .get<Post[]>(`/api/posts/calendar?month=${month}&year=${year}`)
      .subscribe({
        next: (data) => {
          this.calendarPosts.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to load calendar posts');
          this.loading.set(false);
        },
      });
  }

  loadPost(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<Post>(`/api/posts/${id}`).subscribe({
      next: (post) => {
        this.currentPost.set(post);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load post');
        this.loading.set(false);
      },
    });
  }

  createPost(data: CreatePostRequest): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.post<Post>('/api/posts', data).subscribe({
      next: (post) => {
        this.posts.update((list) => [post, ...list]);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to create post');
        this.loading.set(false);
      },
    });
  }

  updatePost(id: string, data: UpdatePostRequest): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.patch<Post>(`/api/posts/${id}`, data).subscribe({
      next: (updated) => {
        this.posts.update((list) =>
          list.map((p) => (p.id === id ? updated : p))
        );
        this.currentPost.set(updated);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to update post');
        this.loading.set(false);
      },
    });
  }

  deletePost(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.delete(`/api/posts/${id}`).subscribe({
      next: () => {
        this.posts.update((list) => list.filter((p) => p.id !== id));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to delete post');
        this.loading.set(false);
      },
    });
  }

  exportCsv(filters: PostFilters = {}): void {
    const params = new URLSearchParams();
    if (filters.search) params.set('q', filters.search);
    if (filters.platform) params.set('platform', filters.platform);
    if (filters.status) params.set('status', filters.status);

    this.http
      .get(`/api/posts/export?${params.toString()}`, { responseType: 'blob' })
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `posts-${new Date().toISOString().slice(0, 10)}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to export posts');
        },
      });
  }
}
