import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { AudiusApiService } from '../../services/audius-api.service';
import { PlayerService } from '../../services/player.service';
import { FavoritesService } from '../../services/favorites.service';
import type { AudiusTrack } from '../../models/audius.models';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { formatDuration } from '../../services/utils/format.helpers';
import { buildPlayableQueue, getPreferredArtworkUrl } from '../../services/utils/track-list.helpers';

@Component({
  selector: 'app-artist',
  standalone: true,
  imports: [],
  templateUrl: './artist.component.html',
  styleUrl: './artist.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArtistComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  artistName = signal('');
  artistHandle = signal('');
  tracks = signal<AudiusTrack[]>([]);
  loading = signal(false);
  brokenCoverIds = signal<Set<string>>(new Set());

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private audius: AudiusApiService,
    private player: PlayerService,
    public favoritesService: FavoritesService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/free-music']);
      return;
    }
    this.loadArtist(id);
  }

  private loadArtist(userId: string): void {
    this.loading.set(true);
    forkJoin({
      user: this.audius.getUserById(userId).pipe(catchError(() => of(null))),
      tracks: this.audius.getUserTracks(userId, 50).pipe(catchError(() => of([] as AudiusTrack[])))
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => {
        if (result.user) {
          this.artistName.set(result.user.name);
          this.artistHandle.set(result.user.handle);
        } else {
          this.artistName.set('Unknown Artist');
          this.artistHandle.set('');
        }
        this.tracks.set(result.tracks);
        this.loading.set(false);
      },
      error: () => {
        this.artistName.set('Unknown Artist');
        this.artistHandle.set('');
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
    if (this.tracks().length === 0) return;
    this.play(this.tracks()[0]);
  }

  toggleFavorite(trackId: string, e: Event): void {
    e.stopPropagation();
    this.favoritesService.toggle(trackId);
  }

  onCoverError(trackId: string): void {
    this.brokenCoverIds.update((s) => new Set(s).add(trackId));
  }

  back(): void {
    this.router.navigate(['/free-music']);
  }

  artworkUrl(track: AudiusTrack): string {
    return getPreferredArtworkUrl(this.audius, track);
  }

  formatDuration = formatDuration;
}
