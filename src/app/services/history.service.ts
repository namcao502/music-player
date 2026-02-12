import { Injectable, signal, effect } from '@angular/core';
import { PlayerService, type PlayableTrack } from './player.service';
import { NotificationService } from './utils/notification.service';
import { TOAST } from '../constants/ui-strings';

export interface HistoryEntry {
  track: PlayableTrack;
  playedAt: number;
}

const STORAGE_KEY = 'music-player-history';
const PLAY_COUNTS_KEY = 'music-player-play-counts';
const MAX_HISTORY = 50;

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private history = signal<HistoryEntry[]>(this.loadFromStorage());
  private playCounts = signal<Record<string, number>>(this.loadPlayCounts());

  historyList = this.history.asReadonly();
  playCountMap = this.playCounts.asReadonly();

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
    this.playCounts.update((counts) => ({ ...counts, [track.id]: (counts[track.id] ?? 0) + 1 }));
    this.savePlayCounts();
    this.history.update((list) => {
      const filtered = list.filter((e) => e.track.id !== track.id);
      const next = [{ track, playedAt: Date.now() }, ...filtered].slice(0, MAX_HISTORY);
      return next;
    });
    this.saveToStorage();
  }

  clearHistory(): void {
    this.history.set([]);
    this.playCounts.set({});
    this.saveToStorage();
    this.savePlayCounts();
    this.notification.success(TOAST.HISTORY_CLEARED);
  }

  removeEntry(entry: HistoryEntry): void {
    this.history.update((list) => list.filter((e) => !(e.track.id === entry.track.id && e.playedAt === entry.playedAt)));
    this.saveToStorage();
    this.notification.success(TOAST.REMOVED_FROM_HISTORY);
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
      this.notification.error(TOAST.HISTORY_SAVE_FAILED);
    }
  }

  private loadPlayCounts(): Record<string, number> {
    try {
      const raw = localStorage.getItem(PLAY_COUNTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return {};
  }

  private savePlayCounts(): void {
    try {
      localStorage.setItem(PLAY_COUNTS_KEY, JSON.stringify(this.playCounts()));
    } catch {
      // non-critical, silently ignore
    }
  }
}
