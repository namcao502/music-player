import { Injectable, signal } from '@angular/core';
import { concatMap, forkJoin, from, map, Observable, of, reduce } from 'rxjs';
import type { Playlist } from '../models/playlist.model';
import { PLAYLISTS_STORAGE_KEY } from '../models/playlist.model';
import { AudiusApiService } from './audius-api.service';
import type { PlayableTrack } from './player.service';
import { NotificationService } from './utils/notification.service';
import { TOAST } from '../constants/ui-strings';

function isPlaylistArray(value: unknown): value is Playlist[] {
  if (!Array.isArray(value)) return false;
  return value.every((item) => {
    if (item === null || typeof item !== 'object') return false;
    const obj = item as Record<string, unknown>;
    return typeof obj['id'] === 'string' && typeof obj['name'] === 'string' && Array.isArray(obj['trackIds']);
  });
}

@Injectable({ providedIn: 'root' })
export class PlaylistService {
  private playlists = signal<Playlist[]>([]);

  playlistsList = this.playlists.asReadonly();

  constructor(private audius: AudiusApiService, private notification: NotificationService) {
    this.loadFromStorage();
  }

  loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(PLAYLISTS_STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isPlaylistArray(parsed)) {
          this.playlists.set(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }
    this.playlists.set([]);
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(this.playlists()));
    } catch (error) {
      console.error('Failed to save playlists to localStorage:', error);
      this.notification.error(TOAST.PLAYLIST_SAVE_FAILED);
    }
  }

  create(name: string): string {
    const id = 'pl-' + Date.now();
    const trimmed = name.trim() || 'Playlist';
    const list = [...this.playlists(), { id, name: trimmed, trackIds: [] }];
    this.playlists.set(list);
    this.saveToStorage();
    this.notification.success(TOAST.PLAYLIST_CREATED(trimmed));
    return id;
  }

  rename(id: string, name: string): void {
    const list = this.playlists().map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p));
    this.playlists.set(list);
    this.saveToStorage();
    this.notification.success(TOAST.PLAYLIST_RENAMED);
  }

  delete(id: string): void {
    const p = this.getPlaylist(id);
    this.playlists.set(this.playlists().filter((pl) => pl.id !== id));
    this.saveToStorage();
    this.notification.success(p ? TOAST.PLAYLIST_DELETED(p.name) : TOAST.PLAYLIST_DELETED_GENERIC);
  }

  addTrack(playlistId: string, trackId: string): void {
    const playlist = this.getPlaylist(playlistId);
    if (playlist?.trackIds.includes(trackId)) {
      this.notification.warning(TOAST.TRACK_ALREADY_IN_PLAYLIST);
      return;
    }
    const list = this.playlists().map((p) => {
      if (p.id !== playlistId) return p;
      return { ...p, trackIds: [...p.trackIds, trackId] };
    });
    this.playlists.set(list);
    this.saveToStorage();
    if (playlist) {
      this.notification.success(TOAST.ADDED_TO_PLAYLIST(playlist.name));
    }
  }

  removeTrack(playlistId: string, trackId: string): void {
    const list = this.playlists().map((p) =>
      p.id === playlistId ? { ...p, trackIds: p.trackIds.filter((tid) => tid !== trackId) } : p
    );
    this.playlists.set(list);
    this.saveToStorage();
    this.notification.success(TOAST.TRACK_REMOVED_FROM_PLAYLIST);
  }

  // F8: Tag management
  addTag(playlistId: string, tag: string): void {
    const list = this.playlists().map((p) => {
      if (p.id !== playlistId) return p;
      const tags = p.tags ?? [];
      if (tags.includes(tag)) return p;
      return { ...p, tags: [...tags, tag] };
    });
    this.playlists.set(list);
    this.saveToStorage();
  }

  removeTag(playlistId: string, tag: string): void {
    const list = this.playlists().map((p) => {
      if (p.id !== playlistId) return p;
      return { ...p, tags: (p.tags ?? []).filter((t) => t !== tag) };
    });
    this.playlists.set(list);
    this.saveToStorage();
  }

  moveTrack(playlistId: string, fromIndex: number, toIndex: number): void {
    const list = this.playlists().map((p) => {
      if (p.id !== playlistId) return p;
      const ids = [...p.trackIds];
      if (fromIndex < 0 || fromIndex >= ids.length || toIndex < 0 || toIndex >= ids.length) return p;
      const [item] = ids.splice(fromIndex, 1);
      ids.splice(toIndex, 0, item);
      return { ...p, trackIds: ids };
    });
    this.playlists.set(list);
    this.saveToStorage();
  }

  exportPlaylist(id: string): string | null {
    const p = this.getPlaylist(id);
    if (!p) return null;
    return JSON.stringify(p, null, 2);
  }

  importPlaylist(json: string): string | null {
    try {
      const data = JSON.parse(json);
      // Validate: must be object, not array or primitive
      if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
      if (!data.name || !Array.isArray(data.trackIds)) return null;
      // Filter trackIds: only non-empty strings
      const validIds = data.trackIds
        .filter((id: unknown) => typeof id === 'string' && id.trim().length > 0)
        .map((id: string) => id.trim());
      const id = 'pl-' + Date.now();
      const importedName = String(data.name).trim() || 'Playlist';
      const imported = { id, name: importedName, trackIds: validIds };
      this.playlists.update((list) => [...list, imported]);
      this.saveToStorage();
      this.notification.success(TOAST.PLAYLIST_IMPORTED(importedName));
      return id;
    } catch {
      this.notification.error(TOAST.PLAYLIST_IMPORT_FAILED);
      return null;
    }
  }

  getPlaylist(id: string): Playlist | undefined {
    return this.playlists().find((p) => p.id === id);
  }

  /** Resolve playlist track IDs to PlayableTrack[] via Audius API (for playing). */
  getPlayableTracks(playlistId: string): Observable<PlayableTrack[]> {
    const playlist = this.getPlaylist(playlistId);
    if (!playlist || playlist.trackIds.length === 0) return of([]);

    const chunkSize = 10;
    const chunks: string[][] = [];
    for (let i = 0; i < playlist.trackIds.length; i += chunkSize) {
      chunks.push(playlist.trackIds.slice(i, i + chunkSize));
    }

    return from(chunks).pipe(
      concatMap((chunk) =>
        forkJoin(chunk.map((tid) => this.audius.getTrackById(tid))).pipe(
          map((tracks) => {
            const result: PlayableTrack[] = [];
            tracks.forEach((t) => {
              if (!t) return;
              result.push({
                id: t.id,
                title: t.title,
                artist: t.user?.name,
                duration: t.duration,
                coverArtUrl: this.audius.getArtworkUrl(t) || undefined,
                streamUrl: this.audius.getStreamEndpointUrl(t.id)
              });
            });
            return result;
          })
        )
      ),
      reduce((acc, batch) => [...acc, ...batch], [] as PlayableTrack[])
    );
  }
}
