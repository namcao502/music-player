import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AudiusApiService } from '../../services/audius-api.service';
import { PlayerService, type PlayableTrack } from '../../services/player.service';
import { FavoritesService } from '../../services/favorites.service';
import type { AudiusTrack } from '../../models/audius.models';

@Component({
  selector: 'app-trending',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './trending.component.html',
  styleUrl: './trending.component.scss'
})
export class TrendingComponent implements OnInit {
  tracks = signal<AudiusTrack[]>([]);
  loading = signal(false);
  brokenCoverIds = signal<Set<string>>(new Set());

  constructor(
    private audius: AudiusApiService,
    private player: PlayerService,
    public favoritesService: FavoritesService
  ) {}

  ngOnInit(): void {
    this.loadTrending();
  }

  private loadTrending(): void {
    this.loading.set(true);
    this.audius.getTrendingTracks(50).subscribe({
      next: (data) => {
        this.tracks.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
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

  toggleFavorite(trackId: string, e: Event): void {
    e.stopPropagation();
    this.favoritesService.toggle(trackId);
  }

  onCoverError(trackId: string): void {
    this.brokenCoverIds.update((s) => new Set(s).add(trackId));
  }

  artworkUrl(track: AudiusTrack): string {
    return this.audius.getArtworkUrl(track, '480x480') || this.audius.getArtworkUrl(track, '150x150');
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
