import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PlaylistModalService } from '../../services/playlist-modal.service';
import { PlaylistService } from '../../services/playlist.service';
import { PlayerService } from '../../services/player.service';

@Component({
  selector: 'app-playlist-list',
  standalone: true,
  imports: [],
  templateUrl: './playlist-list.component.html',
  styleUrl: './playlist-list.component.scss'
})
export class PlaylistListComponent {
  importError = signal('');

  constructor(
    public playlistService: PlaylistService,
    private player: PlayerService,
    private router: Router,
    private modal: PlaylistModalService
  ) {}

  async createPlaylist(): Promise<void> {
    const name = await this.modal.openPrompt('Playlist name', 'New playlist');
    if (name == null) return;
    const id = this.playlistService.create(name.trim() || 'New playlist');
    this.router.navigate(['/playlists', id]);
  }

  play(id: string): void {
    this.playlistService.getPlayableTracks(id).subscribe((tracks) => {
      if (tracks.length === 0) return;
      this.player.playQueue(tracks, 0);
    });
  }

  async rename(playlist: { id: string; name: string }): Promise<void> {
    const name = await this.modal.openPrompt('Rename playlist', playlist.name);
    if (name != null && name.trim()) this.playlistService.rename(playlist.id, name.trim());
  }

  async delete(id: string, name: string): Promise<void> {
    const confirmed = await this.modal.openConfirm(`Delete "${name}"?`, 'Delete');
    if (!confirmed) return;
    this.playlistService.delete(id);
  }

  open(id: string): void {
    this.router.navigate(['/playlists', id]);
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
          this.importError.set('Invalid playlist file.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }
}
