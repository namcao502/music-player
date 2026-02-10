import { Injectable, signal, effect } from '@angular/core';
import { PlayerService, type PlayableTrack } from './player.service';
import { NotificationService } from './utils/notification.service';

export interface HistoryEntry {
  track: PlayableTrack;
  playedAt: number;
}

const STORAGE_KEY = 'music-player-history';
const MAX_HISTORY = 50;

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private history = signal<HistoryEntry[]>(this.loadFromStorage());

  historyList = this.history.asReadonly();

  constructor(private player: PlayerService, private notification: NotificationService) {
    effect(() => {
      const np = this.player.nowPlaying();
      if (!np) return;
      // Skip if this track is already the most recent history entry
      const current = this.history();
      if (current.length > 0 && current[0].track.id === np.track.id) {
        return;
      }
      this.addEntry(np.track);
    }, { allowSignalWrites: true });
  }

  private addEntry(track: PlayableTrack): void {
    this.history.update((list) => {
      const filtered = list.filter((e) => e.track.id !== track.id);
      const next = [{ track, playedAt: Date.now() }, ...filtered].slice(0, MAX_HISTORY);
      return next;
    });
    this.saveToStorage();
  }

  clearHistory(): void {
    this.history.set([]);
    this.saveToStorage();
  }

  private loadFromStorage(): HistoryEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.slice(0, MAX_HISTORY);
      }
    } catch {
      // ignore
    }
    return [];
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history()));
    } catch (error) {
      console.error('Failed to save history to localStorage:', error);
      this.notification.error('Failed to save history. Storage may be full.');
    }
  }
}
