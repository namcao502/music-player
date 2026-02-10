import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AudiusApiService } from '../../services/audius-api.service';
import { PlayerService, type PlayableTrack } from '../../services/player.service';
import { FavoritesService } from '../../services/favorites.service';
import type { AudiusTrack } from '../../models/audius.models';

@Component({
  selector: 'app-artist',
  standalone: true,
  imports: [],
  templateUrl: './artist.component.html',
  styleUrl: './artist.component.scss'
})
export class ArtistComponent implements OnInit {
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
    this.audius.getUserById(userId).subscribe((user) => {
      if (user) {
        this.artistName.set(user.name);
        this.artistHandle.set(user.handle);
      }
    });
    this.audius.getUserTracks(userId, 50).subscribe({
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
    return this.audius.getArtworkUrl(track, '480x480') || this.audius.getArtworkUrl(track, '150x150') || '';
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
