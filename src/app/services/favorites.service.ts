import { Injectable, signal, computed } from '@angular/core';

const STORAGE_KEY = 'music-player-favorites';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private favorites = signal<Set<string>>(this.loadFromStorage());

  favoriteIds = computed(() => this.favorites());

  private loadFromStorage(): Set<string> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch {
      // ignore
    }
    return new Set();
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...this.favorites()]));
    } catch {
      // ignore
    }
  }

  isFavorite(trackId: string): boolean {
    return this.favorites().has(trackId);
  }

  toggle(trackId: string): void {
    this.favorites.update((set) => {
      const next = new Set(set);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      return next;
    });
    this.saveToStorage();
  }

  add(trackId: string): void {
    if (this.favorites().has(trackId)) return;
    this.favorites.update((set) => new Set(set).add(trackId));
    this.saveToStorage();
  }

  remove(trackId: string): void {
    if (!this.favorites().has(trackId)) return;
    this.favorites.update((set) => {
      const next = new Set(set);
      next.delete(trackId);
      return next;
    });
    this.saveToStorage();
  }
}
