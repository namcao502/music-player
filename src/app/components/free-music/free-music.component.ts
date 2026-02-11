import { ChangeDetectionStrategy, Component, DestroyRef, HostListener, inject, OnInit, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AudiusApiService } from '../../services/audius-api.service';
import { FreeMusicStateService } from '../../services/free-music-state.service';
import { PlaylistModalService } from '../../services/playlist-modal.service';
import { PlayerService } from '../../services/player.service';
import { PlaylistService } from '../../services/playlist.service';
import { FavoritesService } from '../../services/favorites.service';
import type { AudiusTrack } from '../../models/audius.models';
import { formatDuration } from '../../services/utils/format.helpers';
import { buildPlayableQueue, getPreferredArtworkUrl } from '../../services/utils/track-list.helpers';

const RECENT_SEARCHES_KEY = 'free-music-recent-searches';
const MAX_RECENT_SEARCHES = 5;
const PAGE_SIZE = 24;

@Component({
  selector: 'app-free-music',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './free-music.component.html',
  styleUrl: './free-music.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FreeMusicComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
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
  /** Sort mode for results. */
  sortMode = signal<'default' | 'duration-asc' | 'duration-desc' | 'artist'>('default');
  /** Whether the custom sort dropdown is open. */
  sortDropdownOpen = signal(false);
  /** Sorted tracks based on sortMode. */
  sortedTracks = computed(() => {
    const list = [...this.tracks()];
    const mode = this.sortMode();
    if (mode === 'duration-asc') return list.sort((a, b) => a.duration - b.duration);
    if (mode === 'duration-desc') return list.sort((a, b) => b.duration - a.duration);
    if (mode === 'artist') return list.sort((a, b) => (a.user?.name ?? '').localeCompare(b.user?.name ?? ''));
    return list;
  });

  constructor(
    private audius: AudiusApiService,
    private player: PlayerService,
    public playlistService: PlaylistService,
    private freeMusicState: FreeMusicStateService,
    private playlistModal: PlaylistModalService,
    public favoritesService: FavoritesService,
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
    this.audius.searchTracks(q, PAGE_SIZE, offset).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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

  clearRecentSearches(): void {
    this.recentSearches.set([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // Ignore
    }
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
    const playables = buildPlayableQueue(this.audius, list);
    const index = list.findIndex((t) => t.id === track.id);
    this.player.playQueue(playables, index >= 0 ? index : 0);
  }

  artworkUrl(track: AudiusTrack): string {
    return getPreferredArtworkUrl(this.audius, track);
  }

  formatDuration = formatDuration;

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

  toggleFavorite(trackId: string, e: Event): void {
    e.stopPropagation();
    this.favoritesService.toggle(trackId);
  }

  closeAddToPlaylist(): void {
    this.addToPlaylistTrackId.set(null);
  }

  toggleSortDropdown(e: Event): void {
    e.stopPropagation();
    this.sortDropdownOpen.update((v) => !v);
  }

  selectSortMode(mode: 'default' | 'duration-asc' | 'duration-desc' | 'artist'): void {
    this.sortMode.set(mode);
    this.sortDropdownOpen.set(false);
  }

  sortLabel(): string {
    const labels: Record<string, string> = {
      'default': 'Default',
      'duration-asc': 'Duration (short first)',
      'duration-desc': 'Duration (long first)',
      'artist': 'Artist name'
    };
    return labels[this.sortMode()] ?? 'Default';
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeAddToPlaylist();
    this.sortDropdownOpen.set(false);
  }
}
