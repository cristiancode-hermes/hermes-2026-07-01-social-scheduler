import { Component, signal, effect, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { AnalyticsService } from '../services/analytics.service';
import { LoadingSkeletonComponent } from '../shared/loading-skeleton.component';
import { EmptyStateComponent } from '../shared/empty-state.component';
import { BadgeComponent } from '../shared/badge.component';
import { RouterLink } from '@angular/router';
import type { Platform } from '../models';
import { PLATFORM_LABELS } from '../models';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [DatePipe, DecimalPipe, LoadingSkeletonComponent, EmptyStateComponent, BadgeComponent, RouterLink],
  template: `
    <div class="p-4 lg:p-6 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Dashboard</h1>
          <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Overview of your social media performance</p>
        </div>
        <div class="flex gap-2">
          @for (opt of dateOptions; track opt.value) {
            <button
              (click)="selectedDays.set(opt.value)"
              class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
              [class.bg-primary-600]="selectedDays() === opt.value"
              [class.text-white]="selectedDays() === opt.value"
              [class.bg-neutral-100]="selectedDays() !== opt.value"
              [class.text-neutral-600]="selectedDays() !== opt.value"
              [class.dark:bg-neutral-800]="selectedDays() !== opt.value"
              [class.dark:text-neutral-300]="selectedDays() !== opt.value"
              [class.hover:bg-neutral-200]="selectedDays() !== opt.value"
              [class.dark:hover:bg-neutral-700]="selectedDays() !== opt.value"
            >
              {{ opt.label }}
            </button>
          }
        </div>
      </div>

      <!-- KPI Cards -->
      @if (analyticsService.loading() && !analyticsService.kpis()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          @for (i of [1,2,3,4]; track i) {
            <app-loading-skeleton variant="card" />
          }
        </div>
      } @else if (analyticsService.error() && !analyticsService.kpis()) {
        <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-card p-8">
          <div class="text-center">
            <p class="text-danger-600 dark:text-danger-400">{{ analyticsService.error() }}</p>
            <button (click)="analyticsService.loadDashboard(selectedDays())" class="mt-3 text-sm text-primary-600 hover:underline">Try again</button>
          </div>
        </div>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-card p-5">
            <div class="flex items-center justify-between mb-3">
              <p class="text-sm font-medium text-neutral-500 dark:text-neutral-400">Total Posts</p>
              <div class="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <svg class="h-5 w-5 text-primary-600 dark:text-primary-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/></svg>
              </div>
            </div>
            <p class="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{{ analyticsService.kpis()?.totalPosts ?? 0 }}</p>
          </div>

          <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-card p-5">
            <div class="flex items-center justify-between mb-3">
              <p class="text-sm font-medium text-neutral-500 dark:text-neutral-400">Published This Month</p>
              <div class="w-9 h-9 rounded-lg bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
                <svg class="h-5 w-5 text-success-600 dark:text-success-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
              </div>
            </div>
            <p class="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{{ analyticsService.kpis()?.publishedThisMonth ?? 0 }}</p>
          </div>

          <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-card p-5">
            <div class="flex items-center justify-between mb-3">
              <p class="text-sm font-medium text-neutral-500 dark:text-neutral-400">Scheduled</p>
              <div class="w-9 h-9 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
                <svg class="h-5 w-5 text-accent-600 dark:text-accent-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>
              </div>
            </div>
            <p class="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{{ analyticsService.kpis()?.scheduled ?? 0 }}</p>
          </div>

          <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-card p-5">
            <div class="flex items-center justify-between mb-3">
              <p class="text-sm font-medium text-neutral-500 dark:text-neutral-400">Engagement Rate</p>
              <div class="w-9 h-9 rounded-lg bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center">
                <svg class="h-5 w-5 text-secondary-600 dark:text-secondary-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd"/></svg>
              </div>
            </div>
            <p class="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{{ (analyticsService.kpis()?.engagementRate ?? 0) | number:'1.1-1' }}%</p>
          </div>
        </div>
      }

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Posts by Platform Chart -->
        @if (analyticsService.postsByPlatform().length > 0) {
          <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-card p-6">
            <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Posts by Platform</h2>
            <div class="flex items-end gap-4 h-48">
              @for (item of analyticsService.postsByPlatform(); track item.platform) {
                <div class="flex-1 flex flex-col items-center gap-2">
                  <span class="text-xs font-medium text-neutral-500">{{ item.count }}</span>
                  <div
                    class="w-full rounded-t-lg transition-all duration-500"
                    [style.height.%]="maxCount() > 0 ? (item.count / maxCount()) * 100 : 0"
                    [style.min-height.rem]="item.count > 0 ? '1.5' : '0'"
                    [class]="platformBarClass(item.platform)"
                  ></div>
                  <span class="text-xs font-medium text-neutral-600 dark:text-neutral-400">{{ PLATFORM_LABELS[item.platform] }}</span>
                </div>
              }
            </div>
          </div>
        } @else {
          <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-card p-6">
            <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Posts by Platform</h2>
            <app-empty-state title="No data yet" description="Post content to see platform breakdown" />
          </div>
        }

        <!-- Recent Posts Timeline -->
        <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-card p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Recent Posts</h2>
            <a routerLink="/posts" class="text-sm text-primary-600 dark:text-primary-400 hover:underline">View all</a>
          </div>

          @if (analyticsService.loading() && analyticsService.recentPosts().length === 0) {
            @for (i of [1,2,3]; track i) {
              <app-loading-skeleton variant="row" />
            }
          } @else if (analyticsService.recentPosts().length === 0) {
            <app-empty-state title="No posts yet" description="Create your first post to get started" [actionLabel]="'Create Post'" (action)="createPost()" />
          } @else {
            <div class="space-y-3">
              @for (post of analyticsService.recentPosts(); track post.id) {
                <a [routerLink]="['/posts', post.id]" class="block p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700">
                  <div class="flex items-center justify-between mb-1">
                    <div class="flex items-center gap-2">
                      <app-badge [variant]="post.status">{{ post.status }}</app-badge>
                      @if (post.platformProfile) {
                        <app-badge [variant]="post.platformProfile.platform">{{ post.platformProfile.platform }}</app-badge>
                      }
                    </div>
                    <span class="text-xs text-neutral-400">{{ post.createdAt | date:'MMM d, h:mm a' }}</span>
                  </div>
                  <p class="text-sm text-neutral-700 dark:text-neutral-300 truncate">{{ post.title }}</p>
                </a>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class DashboardPageComponent {
  protected readonly analyticsService = inject(AnalyticsService);
  protected readonly selectedDays = signal(30);
  protected readonly PLATFORM_LABELS = PLATFORM_LABELS;

  protected readonly dateOptions = [
    { label: '7d', value: 7 },
    { label: '30d', value: 30 },
    { label: '90d', value: 90 },
  ];

  constructor() {
    effect(() => {
      this.analyticsService.loadDashboard(this.selectedDays());
    });
  }

  protected maxCount(): number {
    const counts = this.analyticsService.postsByPlatform().map((p) => p.count);
    return counts.length > 0 ? Math.max(...counts) : 0;
  }

  protected platformBarClass(platform: Platform): string {
    const map: Record<Platform, string> = {
      twitter: 'bg-platform-twitter',
      linkedin: 'bg-platform-linkedin',
      instagram: 'bg-platform-instagram',
      facebook: 'bg-platform-facebook',
    };
    return map[platform] || 'bg-primary-500';
  }

  protected createPost(): void {
    window.location.href = '/posts/new';
  }
}
