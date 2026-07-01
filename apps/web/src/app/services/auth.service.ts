import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import type { User, AuthResponse, LoginRequest, RegisterRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly tokenSignal = signal<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  );

  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = computed(() => this.tokenSignal() !== null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    const token = this.tokenSignal();
    if (token) {
      this.loadUser();
    }
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  private loadUser(): void {
    this.http.get<User>('/api/auth/me').subscribe({
      next: (user) => this.currentUser.set(user),
      error: () => {
        this.tokenSignal.set(null);
        localStorage.removeItem('auth_token');
      },
    });
  }

  login(data: LoginRequest): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.http.post<AuthResponse>('/api/auth/login', data).subscribe({
      next: (res) => {
        this.tokenSignal.set(res.token);
        localStorage.setItem('auth_token', res.token);
        this.currentUser.set(res.user);
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set(err.error?.message || 'Login failed');
      },
    });
  }

  register(data: RegisterRequest): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.http.post<AuthResponse>('/api/auth/register', data).subscribe({
      next: (res) => {
        this.tokenSignal.set(res.token);
        localStorage.setItem('auth_token', res.token);
        this.currentUser.set(res.user);
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set(err.error?.message || 'Registration failed');
      },
    });
  }

  logout(): void {
    this.tokenSignal.set(null);
    this.currentUser.set(null);
    localStorage.removeItem('auth_token');
    this.router.navigate(['/login']);
  }
}
