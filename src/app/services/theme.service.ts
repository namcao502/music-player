import { Injectable, signal, computed } from '@angular/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'music-player-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private theme = signal<Theme>(this.loadInitial());

  current = this.theme.asReadonly();
  isDark = computed(() => this.theme() === 'dark');
  isLight = computed(() => this.theme() === 'light');

  constructor() {
    this.apply(this.theme());
  }

  private loadInitial(): Theme {
    if (typeof localStorage === 'undefined') return 'dark';
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  private apply(theme: Theme): void {
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    document.documentElement.classList.add(`theme-${theme}`);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
    this.apply(theme);
  }

  toggle(): void {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  }
}
