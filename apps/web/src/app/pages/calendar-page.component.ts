import { Component, signal, effect, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { PostService } from '../services/post.service';
import { BadgeComponent } from '../shared/badge.component';
import { ModalComponent } from '../shared/modal.component';
import { RouterLink } from '@angular/router';
import type { Post, PostStatus } from '../models';
import { PLATFORM_LABELS, STATUS_LABELS } from '../models';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  posts: Post[];
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [DatePipe, BadgeComponent, ModalComponent, RouterLink],
  template: `
    <div class="p-4 lg:p-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Calendar</h1>
          <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Manage your scheduled posts</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5">
            <button
              (click)="view.set('month')"
              class="px-3 py-1.5 text-sm font-medium rounded-md transition-all"
              [class.bg-white]="view() === 'month'"
              [class.dark:bg-neutral-700]="view() === 'month'"
              [class.shadow-sm]="view() === 'month'"
              [class.text-primary-600]="view() === 'month'"
              [class.dark:text-primary-400]="view() === 'month'"
              [class.text-neutral-600]="view() !== 'month'"
              [class.dark:text-neutral-400]="view() !== 'month'"
            >
              Month
            </button>
            <button
              (click)="view.set('week')"
              class="px-3 py-1.5 text-sm font-medium rounded-md transition-all"
              [class.bg-white]="view() === 'week'"
              [class.dark:bg-neutral-700]="view() === 'week'"
              [class.shadow-sm]="view() === 'week'"
              [class.text-primary-600]="view() === 'week'"
              [class.dark:text-primary-400]="view() === 'week'"
              [class.text-neutral-600]="view() !== 'week'"
              [class.dark:text-neutral-400]="view() !== 'week'"
            >
              Week
            </button>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <button
            (click)="previousPeriod()"
            class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors"
          >
            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
          </button>
          <button
            (click)="goToToday()"
            class="px-3 py-1.5 text-sm font-medium rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            Today
          </button>
          <button
            (click)="nextPeriod()"
            class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors"
          >
            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
        <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{{ headerText() }}</h2>
        <div class="w-24"></div>
      </div>

      @if (postService.loading() && postService.calendarPosts().length === 0) {
        <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-card p-4">
          <div class="grid grid-cols-7 gap-px bg-neutral-200 dark:bg-neutral-800 rounded-lg overflow-hidden">
            @for (i of [1,2,3,4,5,6,7]; track i) {
              <div class="bg-neutral-100 dark:bg-neutral-800 p-3 min-h-[120px]">
                <div class="h-3 w-8 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse mb-2"></div>
              </div>
            }
            @for (i of [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35]; track i) {
              <div class="bg-white dark:bg-neutral-900 p-3 min-h-[120px]">
                <div class="h-3 w-6 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
              </div>
            }
          </div>
        </div>
      } @else if (postService.error() && postService.calendarPosts().length === 0) {
        <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-card p-8 text-center">
          <p class="text-danger-600 dark:text-danger-400">{{ postService.error() }}</p>
          <button (click)="loadPosts()" class="mt-3 text-sm text-primary-600 hover:underline">Try again</button>
        </div>
      } @else {
        @if (view() === 'month') {
          <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-card overflow-hidden">
            <!-- Weekday headers -->
            <div class="grid grid-cols-7 border-b border-neutral-200 dark:border-neutral-800">
              @for (day of weekdays; track day) {
                <div class="p-3 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider">{{ day }}</div>
              }
            </div>
            <!-- Calendar grid -->
            <div class="grid grid-cols-7">
              @for (day of monthDays(); track day.date.toISOString()) {
                <div
                  class="min-h-[120px] p-2 border-b border-r border-neutral-100 dark:border-neutral-800 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  [class.bg-neutral-50]="!day.isCurrentMonth"
                  [class.dark:bg-neutral-900]="!day.isCurrentMonth"
                  [class.bg-primary-50]="day.isToday"
                  [class.dark:bg-primary-900/10]="day.isToday"
                  (click)="onDateClick(day.date)"
                >
                  <div class="flex items-center justify-between mb-1">
                    <span
                      class="text-sm font-medium"
                      [class.text-neutral-400]="!day.isCurrentMonth"
                      [class.text-neutral-900]="day.isCurrentMonth && !day.isToday"
                      [class.dark:text-neutral-100]="day.isCurrentMonth && !day.isToday"
                      [class.text-primary-600]="day.isToday"
                      [class.dark:text-primary-400]="day.isToday"
                    >
                      {{ day.date.getDate() }}
                    </span>
                  </div>
                  <div class="space-y-1">
                    @for (post of day.posts.slice(0, 3); track post.id) {
                      <div
                        class="text-xs px-1.5 py-0.5 rounded truncate cursor-pointer font-medium"
                        [class]="postStatusBadge(post.status)"
                        (click)="$event.stopPropagation(); onPostClick(post)"
                      >
                        {{ post.title }}
                      </div>
                    }
                    @if (day.posts.length > 3) {
                      <span class="text-xs text-neutral-400 px-1">+{{ day.posts.length - 3 }} more</span>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        } @else {
          <!-- Weekly view -->
          <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-card overflow-hidden">
            <div class="grid grid-cols-7 border-b border-neutral-200 dark:border-neutral-800">
              @for (day of weekDays(); track day.date.toISOString()) {
                <div
                  class="p-3 text-center border-r border-neutral-100 dark:border-neutral-800 last:border-r-0"
                  [class.bg-primary-50]="day.isToday"
                  [class.dark:bg-primary-900/10]="day.isToday"
                >
                  <div class="text-xs font-semibold text-neutral-500 uppercase">{{ weekdays[$index] }}</div>
                  <div
                    class="text-lg font-bold mt-1"
                    [class.text-primary-600]="day.isToday"
                    [class.text-neutral-900]="!day.isToday"
                    [class.dark:text-neutral-100]="!day.isToday"
                    [class.dark:text-primary-400]="day.isToday"
                  >
                    {{ day.date.getDate() }}
                  </div>
                </div>
              }
            </div>
            <div class="grid grid-cols-7">
              @for (day of weekDays(); track day.date.toISOString()) {
                <div
                  class="min-h-[400px] p-2 border-r border-neutral-100 dark:border-neutral-800 last:border-r-0 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  (click)="onDateClick(day.date)"
                >
                  @for (post of day.posts; track post.id) {
                    <div
                      class="text-xs px-2 py-1.5 rounded mb-1 cursor-pointer font-medium truncate"
                      [class]="postStatusBadge(post.status)"
                      (click)="$event.stopPropagation(); onPostClick(post)"
                    >
                      {{ post.title }}
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }
      }

      <!-- Post Detail Modal -->
      <app-modal [isOpen]="selectedPost() !== null" (close)="selectedPost.set(null)" title="Post Details" size="lg">
        @if (selectedPost(); as post) {
          <div class="space-y-4">
            <div class="flex items-center gap-2">
              <app-badge [variant]="post.status">{{ STATUS_LABELS[post.status] }}</app-badge>
              @if (post.platformProfile) {
                <app-badge [variant]="post.platformProfile.platform">{{ PLATFORM_LABELS[post.platformProfile.platform] }}</app-badge>
              }
            </div>
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{{ post.title }}</h3>
            <p class="text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">{{ post.content }}</p>
            @if (post.scheduledAt) {
              <p class="text-sm text-neutral-500">Scheduled: {{ post.scheduledAt | date:'MMM d, yyyy h:mm a' }}</p>
            }
            <div class="flex gap-3 pt-2">
              <a [routerLink]="['/posts', post.id]" class="text-sm text-primary-600 hover:underline">View details</a>
              <a [routerLink]="['/posts', post.id, 'edit']" class="text-sm text-primary-600 hover:underline">Edit</a>
            </div>
          </div>
        }
      </app-modal>
    </div>
  `,
})
export class CalendarPageComponent {
  protected readonly postService = inject(PostService);
  protected readonly view = signal<'month' | 'week'>('month');
  protected readonly currentDate = signal(new Date());
  protected readonly selectedPost = signal<Post | null>(null);
  protected readonly weekdays = WEEKDAYS;
  protected readonly PLATFORM_LABELS = PLATFORM_LABELS;
  protected readonly STATUS_LABELS = STATUS_LABELS;

  constructor() {
    effect(() => {
      this.loadPosts();
    });
  }

  protected loadPosts(): void {
    const date = this.currentDate();
    this.postService.loadCalendarPosts(date.getMonth() + 1, date.getFullYear());
  }

  protected readonly headerText = computed(() => {
    const date = this.currentDate();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    if (this.view() === 'month') {
      return `${months[date.getMonth()]} ${date.getFullYear()}`;
    }
    const weekStart = this.weekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return `${months[weekStart.getMonth()]} ${weekStart.getDate()} - ${months[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
  });

  protected readonly monthDays = computed(() => {
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const days: CalendarDay[] = [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startPad - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push(this.makeDay(d, false));
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      days.push(this.makeDay(d, true));
    }

    // Next month padding to fill 6 rows
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push(this.makeDay(d, false));
    }

    return days;
  });

  protected readonly weekDays = computed(() => {
    const date = this.currentDate();
    const start = this.weekStart(date);
    const days: CalendarDay[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const posts = this.postService.calendarPosts().filter((p) => {
        if (!p.scheduledAt) return false;
        const pDate = new Date(p.scheduledAt);
        return this.isSameDay(pDate, d);
      });
      const today = new Date();
      days.push({
        date: d,
        isCurrentMonth: d.getMonth() === date.getMonth(),
        isToday: this.isSameDay(d, today),
        posts,
      });
    }
    return days;
  });

  private makeDay(date: Date, isCurrentMonth: boolean): CalendarDay {
    const today = new Date();
    const posts = this.postService.calendarPosts().filter((p) => {
      if (!p.scheduledAt) return false;
      const pDate = new Date(p.scheduledAt);
      return this.isSameDay(pDate, date);
    });
    return {
      date,
      isCurrentMonth,
      isToday: this.isSameDay(date, today),
      posts,
    };
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
  }

  private weekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
  }

  protected previousPeriod(): void {
    this.currentDate.update((d) => {
      const newDate = new Date(d);
      if (this.view() === 'month') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setDate(newDate.getDate() - 7);
      }
      return newDate;
    });
  }

  protected nextPeriod(): void {
    this.currentDate.update((d) => {
      const newDate = new Date(d);
      if (this.view() === 'month') {
        newDate.setMonth(newDate.getMonth() + 1);
      } else {
        newDate.setDate(newDate.getDate() + 7);
      }
      return newDate;
    });
  }

  protected goToToday(): void {
    this.currentDate.set(new Date());
  }

  protected onDateClick(date: Date): void {
    // Navigate to new post page with date pre-filled
    const dateStr = date.toISOString().split('T')[0];
    window.location.href = `/posts/new?scheduledAt=${dateStr}`;
  }

  protected onPostClick(post: Post): void {
    this.selectedPost.set(post);
  }

  protected postStatusBadge(status: PostStatus): string {
    const map: Record<PostStatus, string> = {
      draft: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200',
      scheduled: 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300',
      published: 'bg-success-100 text-success-700 dark:bg-success-900/50 dark:text-success-300',
      failed: 'bg-danger-100 text-danger-700 dark:bg-danger-900/50 dark:text-danger-300',
    };
    return map[status] || map.draft;
  }
}
