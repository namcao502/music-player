import { Component, HostListener, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AudiusApiService } from '../../services/audius-api.service';
import { FreeMusicStateService } from '../../services/free-music-state.service';
import { PlaylistModalService } from '../../services/playlist-modal.service';
import { PlayerService } from '../../services/player.service';
import { PlaylistService } from '../../services/playlist.service';
import type { AudiusTrack } from '../../models/audius.models';
import type { PlayableTrack } from '../../services/player.service';

const RECENT_SEARCHES_KEY = 'free-music-recent-searches';
const MAX_RECENT_SEARCHES = 5;
const PAGE_SIZE = 24;

@Component({
  selector: 'app-free-music',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './free-music.component.html',
  styleUrl: './free-music.component.scss'
})
export class FreeMusicComponent implements OnInit {
  query = signal('');
  tracks = signal<AudiusTrack[]>([]);
  loading = signal(false);
  error = signal('');
  recentSearches = signal<string[]>([]);
  /** Track IDs whose cover image failed to load; show music symbol instead. */
  brokenCoverIds = signal<Set<string>>(new Set());
  /** Current page (1-based). Only relevant when there are results. */
  page = signal(1);
  /** True when the last response had a full page (more may exist). */
  hasNextPage = signal(false);
  /** Track id for which "Add to playlist" dropdown is open, or null. */
  addToPlaylistTrackId = signal<string | null>(null);
  /** When true, open dropdown to the left of the button (e.g. card near right edge). */
  addToPlaylistDropdownLeft = signal(false);

  constructor(
    private audius: AudiusApiService,
    private player: PlayerService,
    public playlistService: PlaylistService,
    private freeMusicState: FreeMusicStateService,
    private playlistModal: PlaylistModalService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.restoreStateFromService();
    this.loadRecentSearchesFromStorage();
  }

  /** Restore query, tracks, page, hasNextPage, brokenCoverIds from state service (persists across tab switch). */
  private restoreStateFromService(): void {
    const q = this.freeMusicState.query();
    const savedTracks = this.freeMusicState.tracks();
    if (q || savedTracks.length > 0) {
      this.query.set(q);
      this.tracks.set([...savedTracks]);
      this.page.set(this.freeMusicState.page());
      this.hasNextPage.set(this.freeMusicState.hasNextPage());
      this.brokenCoverIds.set(new Set(this.freeMusicState.brokenCoverIds()));
    }
  }

  private loadRecentSearchesFromStorage(): void {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        if (Array.isArray(parsed)) {
          this.recentSearches.set(parsed.slice(0, MAX_RECENT_SEARCHES));
        }
      }
    } catch {
      // Ignore invalid stored data
    }
  }

  private saveStateToService(): void {
    this.freeMusicState.query.set(this.query());
    this.freeMusicState.tracks.set(this.tracks());
    this.freeMusicState.page.set(this.page());
    this.freeMusicState.hasNextPage.set(this.hasNextPage());
    this.freeMusicState.brokenCoverIds.set(new Set(this.brokenCoverIds()));
  }

  onSearch(): void {
    const q = this.query().trim();
    if (!q) return;
    this.addToRecentSearches(q);
    this.error.set('');
    this.brokenCoverIds.set(new Set());
    this.page.set(1);
    this.saveStateToService();
    this.loadPage(1);
  }

  goToPrevPage(): void {
    const p = this.page();
    if (p <= 1) return;
    this.page.set(p - 1);
    this.loadPage(p - 1);
  }

  goToNextPage(): void {
    if (!this.hasNextPage()) return;
    const p = this.page();
    this.page.set(p + 1);
    this.loadPage(p + 1);
  }

  private loadPage(pageNum: number): void {
    const q = this.query().trim();
    if (!q) return;
    this.error.set('');
    this.loading.set(true);
    const offset = (pageNum - 1) * PAGE_SIZE;
    this.audius.searchTracks(q, PAGE_SIZE, offset).subscribe({
      next: (data) => {
        this.tracks.set(data);
        this.hasNextPage.set(data.length === PAGE_SIZE);
        this.loading.set(false);
        this.saveStateToService();
      },
      error: () => {
        this.error.set('Search failed. Try again.');
        this.loading.set(false);
      }
    });
  }

  runRecentSearch(term: string): void {
    this.query.set(term);
    this.onSearch();
  }

  onCoverError(trackId: string): void {
    this.brokenCoverIds.update((s) => new Set(s).add(trackId));
    this.saveStateToService();
  }

  private addToRecentSearches(q: string): void {
    const current = this.recentSearches();
    const filtered = current.filter((s) => s.toLowerCase() !== q.toLowerCase());
    const next = [q, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    this.recentSearches.set(next);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    } catch {
      // Ignore quota or other storage errors
    }
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
    this.error.set('');
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
    const startIndex = index >= 0 ? index : 0;
    this.player.playQueue(playables, startIndex);
  }

  artworkUrl(track: AudiusTrack): string {
    return this.audius.getArtworkUrl(track, '480x480') || this.audius.getArtworkUrl(track, '150x150');
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  private readonly ADD_TO_PLAYLIST_DROPDOWN_WIDTH = 240;

  openAddToPlaylist(trackId: string, e: Event): void {
    e.stopPropagation();
    const isOpening = this.addToPlaylistTrackId() !== trackId;
    this.addToPlaylistTrackId.set(isOpening ? trackId : null);
    if (isOpening && e.target instanceof HTMLElement) {
      const rect = e.target.getBoundingClientRect();
      const spaceOnRight = typeof window !== 'undefined' ? window.innerWidth - rect.right : 0;
      this.addToPlaylistDropdownLeft.set(spaceOnRight < this.ADD_TO_PLAYLIST_DROPDOWN_WIDTH);
    }
  }

  addTrackToPlaylist(playlistId: string, trackId: string): void {
    this.playlistService.addTrack(playlistId, trackId);
    this.addToPlaylistTrackId.set(null);
  }

  async createPlaylistAndAddTrack(trackId: string): Promise<void> {
    const name = await this.playlistModal.openPrompt('New playlist name', 'New playlist');
    if (name == null) return;
    const id = this.playlistService.create(name.trim() || 'New playlist');
    this.playlistService.addTrack(id, trackId);
    this.addToPlaylistTrackId.set(null);
    this.router.navigate(['/playlists', id]);
  }

  closeAddToPlaylist(): void {
    this.addToPlaylistTrackId.set(null);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeAddToPlaylist();
  }
}
