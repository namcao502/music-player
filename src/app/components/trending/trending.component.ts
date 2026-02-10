import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AudiusApiService } from '../../services/audius-api.service';
import { PlayerService } from '../../services/player.service';
import { FavoritesService } from '../../services/favorites.service';
import type { AudiusTrack } from '../../models/audius.models';
import { formatDuration } from '../../services/utils/format.helpers';
import { buildPlayableQueue, getPreferredArtworkUrl } from '../../services/utils/track-list.helpers';

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
  error = signal<string | null>(null);
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
    this.error.set(null);
    this.audius.getTrendingTracks(50).subscribe({
      next: (data) => {
        this.tracks.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load trending tracks. Please try again.');
        this.loading.set(false);
      }
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
    const playables = buildPlayableQueue(this.audius, list);
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
    return getPreferredArtworkUrl(this.audius, track);
  }

  formatDuration = formatDuration;
}
