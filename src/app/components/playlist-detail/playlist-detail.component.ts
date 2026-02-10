import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, map } from 'rxjs';
import type { AudiusTrack } from '../../models/audius.models';
import { AudiusApiService } from '../../services/audius-api.service';
import { PlaylistModalService } from '../../services/playlist-modal.service';
import { PlaylistService } from '../../services/playlist.service';
import { PlayerService } from '../../services/player.service';
import { formatDuration } from '../../services/utils/format.helpers';
import { getPreferredArtworkUrl } from '../../services/utils/track-list.helpers';

@Component({
  selector: 'app-playlist-detail',
  standalone: true,
  imports: [],
  templateUrl: './playlist-detail.component.html',
  styleUrl: './playlist-detail.component.scss'
})
export class PlaylistDetailComponent implements OnInit {
  playlist = signal<{ id: string; name: string; trackIds: string[] } | null>(null);
  tracks = signal<AudiusTrack[]>([]);
  loading = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public playlistService: PlaylistService,
    private audius: AudiusApiService,
    private player: PlayerService,
    private modal: PlaylistModalService
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
      .pipe(map((arr) => arr.filter((t): t is AudiusTrack => t != null)))
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
    this.playlistService.getPlayableTracks(id).subscribe((playables) => {
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
    const name = await this.modal.openPrompt('Rename playlist', p.name);
    if (name != null && name.trim()) {
      this.playlistService.rename(p.id, name.trim());
      this.playlist.set({ ...p, name: name.trim() });
    }
  }

  async deletePlaylist(): Promise<void> {
    const p = this.playlist();
    if (!p) return;
    const confirmed = await this.modal.openConfirm(`Delete "${p.name}"?`, 'Delete');
    if (!confirmed) return;
    this.playlistService.delete(p.id);
    this.router.navigate(['/playlists']);
  }

  moveTrackUp(index: number): void {
    if (index <= 0) return;
    const p = this.playlist();
    if (!p) return;
    this.playlistService.moveTrack(p.id, index, index - 1);
    this.playlist.set(this.playlistService.getPlaylist(p.id) ?? null);
    this.tracks.update((list) => {
      const arr = [...list];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr;
    });
  }

  moveTrackDown(index: number): void {
    const p = this.playlist();
    if (!p) return;
    const list = this.tracks();
    if (index >= list.length - 1) return;
    this.playlistService.moveTrack(p.id, index, index + 1);
    this.playlist.set(this.playlistService.getPlaylist(p.id) ?? null);
    this.tracks.update((arr) => {
      const copy = [...arr];
      [copy[index], copy[index + 1]] = [copy[index + 1], copy[index]];
      return copy;
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
  }

  back(): void {
    this.router.navigate(['/playlists']);
  }

  formatDuration = formatDuration;

  artworkUrl(track: AudiusTrack): string {
    return getPreferredArtworkUrl(this.audius, track);
  }
}
