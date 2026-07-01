import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { DashboardKpi, PostsByPlatform, Post } from '../models';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);

  readonly kpis = signal<DashboardKpi | null>(null);
  readonly postsByPlatform = signal<PostsByPlatform[]>([]);
  readonly recentPosts = signal<Post[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  loadDashboard(days: number = 30): void {
    this.loading.set(true);
    this.error.set(null);

    this.http
      .get<DashboardKpi>(`/api/analytics/kpis?days=${days}`)
      .subscribe({
        next: (data) => {
          this.kpis.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to load KPIs');
          this.loading.set(false);
        },
      });

    this.http
      .get<PostsByPlatform[]>(`/api/analytics/by-platform?days=${days}`)
      .subscribe({
        next: (data) => this.postsByPlatform.set(data),
      });

    this.http
      .get<Post[]>(`/api/analytics/recent?days=${days}`)
      .subscribe({
        next: (data) => this.recentPosts.set(data),
      });
  }
}
