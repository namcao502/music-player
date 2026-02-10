import { Injectable, signal } from '@angular/core';
import { forkJoin, map, Observable, of } from 'rxjs';
import type { Playlist } from '../models/playlist.model';
import { PLAYLISTS_STORAGE_KEY } from '../models/playlist.model';
import { AudiusApiService } from './audius-api.service';
import type { PlayableTrack } from './player.service';

@Injectable({ providedIn: 'root' })
export class PlaylistService {
  private playlists = signal<Playlist[]>([]);

  playlistsList = this.playlists.asReadonly();

  constructor(private audius: AudiusApiService) {
    this.loadFromStorage();
  }

  loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(PLAYLISTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Playlist[];
        if (Array.isArray(parsed)) {
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
    } catch {
      // ignore
    }
  }

  create(name: string): string {
    const id = 'pl-' + Date.now();
    const list = [...this.playlists(), { id, name: name.trim() || 'Playlist', trackIds: [] }];
    this.playlists.set(list);
    this.saveToStorage();
    return id;
  }

  rename(id: string, name: string): void {
    const list = this.playlists().map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p));
    this.playlists.set(list);
    this.saveToStorage();
  }

  delete(id: string): void {
    this.playlists.set(this.playlists().filter((p) => p.id !== id));
    this.saveToStorage();
  }

  addTrack(playlistId: string, trackId: string): void {
    const list = this.playlists().map((p) => {
      if (p.id !== playlistId) return p;
      if (p.trackIds.includes(trackId)) return p;
      return { ...p, trackIds: [...p.trackIds, trackId] };
    });
    this.playlists.set(list);
    this.saveToStorage();
  }

  removeTrack(playlistId: string, trackId: string): void {
    const list = this.playlists().map((p) =>
      p.id === playlistId ? { ...p, trackIds: p.trackIds.filter((tid) => tid !== trackId) } : p
    );
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
      if (!data || !data.name || !Array.isArray(data.trackIds)) return null;
      const id = 'pl-' + Date.now();
      const imported = { id, name: String(data.name), trackIds: data.trackIds.map(String) };
      this.playlists.update((list) => [...list, imported]);
      this.saveToStorage();
      return id;
    } catch {
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
    const requests = playlist.trackIds.map((tid) => this.audius.getTrackById(tid));
    return forkJoin(requests).pipe(
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
    );
  }
}
