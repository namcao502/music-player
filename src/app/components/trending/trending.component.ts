import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AudiusApiService, AUDIUS_GENRES } from '../../services/audius-api.service';
import { PlayerService } from '../../services/player.service';
import { FavoritesService } from '../../services/favorites.service';
import type { AudiusTrack } from '../../models/audius.models';
import { NotificationService } from '../../services/utils/notification.service';
import { TOAST, ERROR, PAGE, LOADING, EMPTY, LABEL, LABEL_FAVORITES, BTN } from '../../constants/ui-strings';
import { formatDuration } from '../../services/utils/format.helpers';
import { buildPlayableQueue, getPreferredArtworkUrl } from '../../services/utils/track-list.helpers';

@Component({
  selector: 'app-trending',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './trending.component.html',
  styleUrl: './trending.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrendingComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  tracks = signal<AudiusTrack[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  brokenCoverIds = signal<Set<string>>(new Set());
  readonly strings = { PAGE, LOADING, EMPTY, LABEL, LABEL_FAVORITES, BTN };
  // F6: Genre Browsing
  readonly genres = AUDIUS_GENRES;
  selectedGenre = signal<string | null>(null);

  constructor(
    private audius: AudiusApiService,
    private player: PlayerService,
    public favoritesService: FavoritesService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadTrending();
  }

  selectGenre(genre: string | null): void {
    this.selectedGenre.set(genre);
    this.loadTrending();
  }

  private loadTrending(): void {
    this.loading.set(true);
    this.error.set(null);
    const genre = this.selectedGenre() ?? undefined;
    this.audius.getTrendingTracks(50, 0, genre).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.tracks.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(ERROR.TRENDING_FAILED);
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

  // F5: Share Track
  async shareTrack(trackId: string, e: Event): Promise<void> {
    e.stopPropagation();
    const url = `https://audius.co/tracks/${trackId}`;
    try {
      await navigator.clipboard.writeText(url);
      this.notification.success(TOAST.TRACK_LINK_COPIED);
    } catch {
      this.notification.error(TOAST.TRACK_LINK_COPY_FAILED);
    }
  }

  formatDuration = formatDuration;
}
