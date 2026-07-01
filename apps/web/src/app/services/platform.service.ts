import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type {
  PlatformProfile,
  CreatePlatformProfileRequest,
} from '../models';

@Injectable({ providedIn: 'root' })
export class PlatformService {
  private readonly http = inject(HttpClient);

  readonly profiles = signal<PlatformProfile[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  loadProfiles(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<PlatformProfile[]>('/api/platforms').subscribe({
      next: (data) => {
        this.profiles.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load profiles');
        this.loading.set(false);
      },
    });
  }

  createProfile(data: CreatePlatformProfileRequest): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.post<PlatformProfile>('/api/platforms', data).subscribe({
      next: (profile) => {
        this.profiles.update((list) => [...list, profile]);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to create profile');
        this.loading.set(false);
      },
    });
  }

  updateProfile(id: string, data: Partial<CreatePlatformProfileRequest>): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.patch<PlatformProfile>(`/api/platforms/${id}`, data).subscribe({
      next: (updated) => {
        this.profiles.update((list) =>
          list.map((p) => (p.id === id ? updated : p))
        );
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to update profile');
        this.loading.set(false);
      },
    });
  }

  deleteProfile(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.delete(`/api/platforms/${id}`).subscribe({
      next: () => {
        this.profiles.update((list) => list.filter((p) => p.id !== id));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to delete profile');
        this.loading.set(false);
      },
    });
  }
}
