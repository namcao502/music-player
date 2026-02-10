import { Component, OnInit, signal } from '@angular/core';
import { FavoritesService } from '../../services/favorites.service';
import { AudiusApiService } from '../../services/audius-api.service';
import { PlayerService, type PlayableTrack } from '../../services/player.service';
import type { AudiusTrack } from '../../models/audius.models';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.scss'
})
export class FavoritesComponent implements OnInit {
  tracks = signal<AudiusTrack[]>([]);
  loading = signal(false);
  brokenCoverIds = signal<Set<string>>(new Set());

  constructor(
    public favoritesService: FavoritesService,
    private audius: AudiusApiService,
    private player: PlayerService
  ) {}

  ngOnInit(): void {
    this.loadFavorites();
  }

  loadFavorites(): void {
    const ids = [...this.favoritesService.favoriteIds()];
    if (ids.length === 0) {
      this.tracks.set([]);
      return;
    }
    this.loading.set(true);
    const requests = ids.map((id) =>
      this.audius.getTrackById(id).pipe(catchError(() => of(null)))
    );
    forkJoin(requests).subscribe((results) => {
      const valid = results.filter((t): t is AudiusTrack => t != null);
      this.tracks.set(valid);
      this.loading.set(false);
    });
  }

  onTrackClick(track: AudiusTrack): void {
    const np = this.player.nowPlaying();
    if (np?.track.id === track.id) {
      this.player.togglePlayPause();
    } else {
      this.play(track);
    }
  }

  play(track: AudiusTrack): void {
    const list = this.tracks();
    const playables: PlayableTrack[] = list.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.user?.name,
      duration: t.duration,
      coverArtUrl: this.audius.getArtworkUrl(t),
      streamUrl: this.audius.getStreamEndpointUrl(t.id)
    }));
    const index = list.findIndex((t) => t.id === track.id);
    this.player.playQueue(playables, index >= 0 ? index : 0);
  }

  playAll(): void {
    const list = this.tracks();
    if (list.length === 0) return;
    this.play(list[0]);
  }

  removeFavorite(trackId: string, e: Event): void {
    e.stopPropagation();
    this.favoritesService.remove(trackId);
    this.tracks.update((list) => list.filter((t) => t.id !== trackId));
  }

  onCoverError(trackId: string): void {
    this.brokenCoverIds.update((s) => new Set(s).add(trackId));
  }

  artworkUrl(track: AudiusTrack): string {
    return this.audius.getArtworkUrl(track, '480x480') || this.audius.getArtworkUrl(track, '150x150');
  }

  formatDuration(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
