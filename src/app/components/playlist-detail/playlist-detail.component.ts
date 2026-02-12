import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, map } from 'rxjs';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import type { AudiusTrack } from '../../models/audius.models';
import { AudiusApiService } from '../../services/audius-api.service';
import { PlaylistModalService } from '../../services/playlist-modal.service';
import { PlaylistService } from '../../services/playlist.service';
import { PlayerService } from '../../services/player.service';
import { NotificationService } from '../../services/utils/notification.service';
import { TOAST, BTN, EMPTY, LOADING, PLURAL, CONFIRM, PLACEHOLDER } from '../../constants/ui-strings';
import { formatDuration } from '../../services/utils/format.helpers';
import { getPreferredArtworkUrl } from '../../services/utils/track-list.helpers';

@Component({
  selector: 'app-playlist-detail',
  standalone: true,
  imports: [DragDropModule, FormsModule],
  templateUrl: './playlist-detail.component.html',
  styleUrl: './playlist-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlaylistDetailComponent implements OnInit {
  readonly strings = { BTN, EMPTY, LOADING, PLURAL, PLACEHOLDER, TOAST };
  private destroyRef = inject(DestroyRef);
  playlist = signal<{ id: string; name: string; trackIds: string[] } | null>(null);
  tracks = signal<AudiusTrack[]>([]);
  loading = signal(false);
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

  isFiltering = computed(() => this.filterText().trim().length > 0);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public playlistService: PlaylistService,
    private audius: AudiusApiService,
    private player: PlayerService,
    private modal: PlaylistModalService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/playlists']);
      return;
    }
    const p = this.playlistService.getPlaylist(id);
    if (!p) {
      this.router.navigate(['/playlists']);
      return;
    }
    this.playlist.set(p);
    this.loadTracks();
  }

  private loadTracks(): void {
    const p = this.playlist();
    if (!p || p.trackIds.length === 0) {
      this.tracks.set([]);
      return;
    }
    this.loading.set(true);
    forkJoin(p.trackIds.map((tid) => this.audius.getTrackById(tid)))
      .pipe(
        map((arr) => arr.filter((t): t is AudiusTrack => t != null)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (list) => {
          this.tracks.set(list);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  play(): void {
    const id = this.playlist()?.id;
    if (!id) return;
    this.playlistService.getPlayableTracks(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((playables) => {
      if (playables.length === 0) return;
      this.player.playQueue(playables, 0);
    });
  }

  removeTrack(trackId: string): void {
    const p = this.playlist();
    if (!p) return;
    this.playlistService.removeTrack(p.id, trackId);
    this.playlist.set(this.playlistService.getPlaylist(p.id) ?? null);
    this.tracks.update((list) => list.filter((t) => t.id !== trackId));
  }

  async rename(): Promise<void> {
    const p = this.playlist();
    if (!p) return;
    const name = await this.modal.openPrompt(CONFIRM.RENAME_PROMPT, p.name);
    if (name != null && name.trim()) {
      this.playlistService.rename(p.id, name.trim());
      this.playlist.set({ ...p, name: name.trim() });
    }
  }

  async deletePlaylist(): Promise<void> {
    const p = this.playlist();
    if (!p) return;
    const confirmed = await this.modal.openConfirm(CONFIRM.DELETE_PLAYLIST(p.name), BTN.DELETE);
    if (!confirmed) return;
    this.playlistService.delete(p.id);
    this.router.navigate(['/playlists']);
  }

  onDrop(event: CdkDragDrop<AudiusTrack[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    const p = this.playlist();
    if (!p) return;
    this.playlistService.moveTrack(p.id, event.previousIndex, event.currentIndex);
    this.playlist.set(this.playlistService.getPlaylist(p.id) ?? null);
    this.tracks.update((list) => {
      const arr = [...list];
      const [item] = arr.splice(event.previousIndex, 1);
      arr.splice(event.currentIndex, 0, item);
      return arr;
    });
  }

  exportPlaylist(): void {
    const p = this.playlist();
    if (!p) return;
    const json = this.playlistService.exportPlaylist(p.id);
    if (!json) return;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${p.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.notification.success(TOAST.PLAYLIST_EXPORTED);
  }

  async sharePlaylist(): Promise<void> {
    const p = this.playlist();
    if (!p || p.trackIds.length === 0) return;
    const params = new URLSearchParams();
    params.set('tracks', p.trackIds.join(','));
    params.set('name', p.name);
    const url = `${window.location.origin}/import?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      this.notification.success(TOAST.PLAYLIST_LINK_COPIED);
    } catch {
      this.notification.error(TOAST.PLAYLIST_LINK_COPY_FAILED);
    }
  }

  back(): void {
    this.router.navigate(['/playlists']);
  }

  formatDuration = formatDuration;

  artworkUrl(track: AudiusTrack): string {
    return getPreferredArtworkUrl(this.audius, track);
  }
}
