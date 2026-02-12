import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { FavoritesService } from '../../services/favorites.service';
import { AudiusApiService } from '../../services/audius-api.service';
import { PlayerService } from '../../services/player.service';
import type { AudiusTrack } from '../../models/audius.models';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { formatDuration } from '../../services/utils/format.helpers';
import { buildPlayableQueue, getPreferredArtworkUrl } from '../../services/utils/track-list.helpers';
import { NotificationService } from '../../services/utils/notification.service';
import { PAGE, BTN, LOADING, EMPTY, LABEL_FAVORITES, PLACEHOLDER, TOAST } from '../../constants/ui-strings';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FavoritesComponent implements OnInit {
  readonly strings = { PAGE, BTN, LOADING, EMPTY, LABEL_FAVORITES, PLACEHOLDER };
  private destroyRef = inject(DestroyRef);
  tracks = signal<AudiusTrack[]>([]);
  loading = signal(false);
  brokenCoverIds = signal<Set<string>>(new Set());
  filterText = signal('');

  filteredTracks = computed(() => {
    const list = this.tracks();
    const query = this.filterText().toLowerCase().trim();
    if (!query) return list;
    return list.filter((t) =>
      t.title.toLowerCase().includes(query) ||
      (t.user?.name ?? '').toLowerCase().includes(query)
    );
  });

  constructor(
    public favoritesService: FavoritesService,
    private audius: AudiusApiService,
    private player: PlayerService,
    private notification: NotificationService
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
    forkJoin(requests).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (results) => {
        const valid = results.filter((t): t is AudiusTrack => t != null);
        this.tracks.set(valid);
        this.loading.set(false);
      },
      error: () => {
        this.tracks.set([]);
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
    return getPreferredArtworkUrl(this.audius, track);
  }

  addToQueue(track: AudiusTrack, e: Event): void {
    e.stopPropagation();
    const playable = buildPlayableQueue(this.audius, [track])[0];
    this.player.addToQueue(playable);
    this.notification.success(TOAST.ADDED_TO_QUEUE);
  }

  formatDuration = formatDuration;
}
