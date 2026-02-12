import { ChangeDetectionStrategy, Component, DestroyRef, HostListener, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { PlaylistModalService } from '../../services/playlist-modal.service';
import { PlaylistService } from '../../services/playlist.service';
import { PlayerService } from '../../services/player.service';
import { DEFAULT_TAG_COLORS } from '../../models/playlist.model';
import { PAGE, BTN, EMPTY, LABEL, SECTION, ERROR, CONFIRM, PLURAL, SORT } from '../../constants/ui-strings';

@Component({
  selector: 'app-playlist-list',
  standalone: true,
  imports: [],
  templateUrl: './playlist-list.component.html',
  styleUrl: './playlist-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlaylistListComponent {
  readonly strings = { PAGE, BTN, EMPTY, LABEL, SECTION, PLURAL, SORT };
  private destroyRef = inject(DestroyRef);
  importError = signal('');
  sortBy = signal<'name' | 'count'>('name');

  // F8: Playlist Tags
  readonly presetTags = Object.keys(DEFAULT_TAG_COLORS);
  readonly tagColors = DEFAULT_TAG_COLORS;
  filterTag = signal<string | null>(null);
  tagMenuPlaylistId = signal<string | null>(null);

  usedTags = computed(() => {
    const all = this.playlistService.playlistsList().flatMap((p) => p.tags ?? []);
    return [...new Set(all)];
  });

  filteredPlaylists = computed(() => {
    const tag = this.filterTag();
    const list = this.playlistService.playlistsList();
    if (!tag) return list;
    return list.filter((p) => (p.tags ?? []).includes(tag));
  });

  sortedPlaylists = computed(() => {
    const list = [...this.filteredPlaylists()];
    const by = this.sortBy();
    if (by === 'name') list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    else list.sort((a, b) => b.trackIds.length - a.trackIds.length);
    return list;
  });

  constructor(
    public playlistService: PlaylistService,
    private player: PlayerService,
    private router: Router,
    private modal: PlaylistModalService
  ) {}

  async createPlaylist(): Promise<void> {
    const name = await this.modal.openPrompt(CONFIRM.PLAYLIST_NAME_PROMPT, CONFIRM.NEW_PLAYLIST_DEFAULT);
    if (name == null) return;
    const id = this.playlistService.create(name.trim() || CONFIRM.NEW_PLAYLIST_DEFAULT);
    this.router.navigate(['/playlists', id]);
  }

  play(id: string): void {
    this.playlistService.getPlayableTracks(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((tracks) => {
      if (tracks.length === 0) return;
      this.player.playQueue(tracks, 0);
    });
  }

  async rename(playlist: { id: string; name: string }): Promise<void> {
    const name = await this.modal.openPrompt(CONFIRM.RENAME_PROMPT, playlist.name);
    if (name != null && name.trim()) this.playlistService.rename(playlist.id, name.trim());
  }

  async delete(id: string, name: string): Promise<void> {
    const confirmed = await this.modal.openConfirm(CONFIRM.DELETE_PLAYLIST(name), BTN.DELETE);
    if (!confirmed) return;
    this.playlistService.delete(id);
  }

  open(id: string): void {
    this.router.navigate(['/playlists', id]);
  }

  duplicatePlaylist(playlistId: string, e: Event): void {
    e.stopPropagation();
    const newId = this.playlistService.duplicate(playlistId);
    if (newId) this.router.navigate(['/playlists', newId]);
  }

  setSortBy(value: 'name' | 'count'): void {
    this.sortBy.set(value);
  }

  // F8: Tag management
  setFilterTag(tag: string | null): void {
    this.filterTag.set(tag);
  }

  openTagMenu(playlistId: string, e: Event): void {
    e.stopPropagation();
    this.tagMenuPlaylistId.set(this.tagMenuPlaylistId() === playlistId ? null : playlistId);
  }

  toggleTag(playlistId: string, tag: string): void {
    const playlist = this.playlistService.getPlaylist(playlistId);
    if (!playlist) return;
    if ((playlist.tags ?? []).includes(tag)) {
      this.playlistService.removeTag(playlistId, tag);
    } else {
      this.playlistService.addTag(playlistId, tag);
    }
  }

  removeTagFromPlaylist(playlistId: string, tag: string, e: Event): void {
    e.stopPropagation();
    this.playlistService.removeTag(playlistId, tag);
  }

  getTagColor(tag: string): string {
    return this.tagColors[tag] ?? '#888';
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.tagMenuPlaylistId.set(null);
  }

  importPlaylist(): void {
    this.importError.set('');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const json = reader.result as string;
        const id = this.playlistService.importPlaylist(json);
        if (id) {
          this.router.navigate(['/playlists', id]);
        } else {
          this.importError.set(ERROR.INVALID_PLAYLIST_FILE);
        }
      };
      reader.onerror = () => {
        this.importError.set(ERROR.FILE_READ_FAILED);
      };
      reader.readAsText(file);
    };
    input.click();
  }
}
