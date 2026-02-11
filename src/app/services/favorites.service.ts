import { Injectable, signal, computed } from '@angular/core';
import { NotificationService } from './utils/notification.service';
import { TOAST } from '../constants/ui-strings';

const STORAGE_KEY = 'music-player-favorites';

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private favorites = signal<Set<string>>(this.loadFromStorage());

  favoriteIds = computed(() => this.favorites());

  constructor(private notification: NotificationService) {}

  private loadFromStorage(): Set<string> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isStringArray(parsed)) return new Set(parsed);
      }
    } catch {
      // ignore
    }
    return new Set();
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...this.favorites()]));
    } catch (error) {
      console.error('Failed to save favorites to localStorage:', error);
      this.notification.error(TOAST.FAVORITES_SAVE_FAILED);
    }
  }

  isFavorite(trackId: string): boolean {
    return this.favorites().has(trackId);
  }

  toggle(trackId: string): void {
    const wasFavorite = this.favorites().has(trackId);
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
    this.notification.success(wasFavorite ? TOAST.REMOVED_FROM_FAVORITES : TOAST.ADDED_TO_FAVORITES);
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
    this.notification.success(TOAST.REMOVED_FROM_FAVORITES);
  }
}
