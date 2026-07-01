import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DarkModeService {
  private readonly storageKey = 'dark_mode';
  readonly isDark = signal<boolean>(false);

  constructor() {
    const stored = localStorage.getItem(this.storageKey);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = stored !== null ? stored === 'true' : prefersDark;
    this.isDark.set(initial);
    this.applyTheme(initial);

    effect(() => {
      const dark = this.isDark();
      localStorage.setItem(this.storageKey, String(dark));
      this.applyTheme(dark);
    });
  }

  toggle(): void {
    this.isDark.update((v) => !v);
  }

  private applyTheme(dark: boolean): void {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}
