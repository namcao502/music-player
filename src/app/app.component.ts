import { ChangeDetectionStrategy, Component, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PlayerBarComponent } from './components/player-bar/player-bar.component';
import { PlaylistModalComponent } from './components/playlist-modal/playlist-modal.component';
import { ThemeService } from './services/theme.service';
import { PlayerService } from './services/player.service';
import { HistoryService } from './services/history.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, PlayerBarComponent, PlaylistModalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  constructor(
    public theme: ThemeService,
    private player: PlayerService,
    _history: HistoryService
  ) {}

  /** Allow keyboard control when focus is not on an input (e.g. search box). */
  private get canUseMediaKeys(): boolean {
    const el = document.activeElement;
    if (!el) return true;
    const tag = el.tagName.toLowerCase();
    const role = (el.getAttribute?.('role') ?? '').toLowerCase();
    if (tag === 'input') {
      const type = (el.getAttribute?.('type') ?? '').toLowerCase();
      // Allow media keys while the seekbar (range input) is focused.
      if (type === 'range') return true;
      return false;
    }
    if (tag === 'textarea' || tag === 'select') return false;
    if (role === 'textbox' || role === 'searchbox') return false;
    return true;
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent): void {
    if (!this.canUseMediaKeys) return;
    if (!this.player.nowPlaying()) return;

    const key = e.key?.toLowerCase();
    const code = e.code?.toLowerCase();

    if (key === ' ' || code === 'space' || e.key === 'MediaPlayPause') {
      e.preventDefault();
      this.player.togglePlayPause();
      return;
    }
    if (key === 'arrowright' || code === 'arrowright' || e.key === 'MediaTrackNext') {
      e.preventDefault();
      this.player.next();
      return;
    }
    if (key === 'arrowleft' || code === 'arrowleft' || e.key === 'MediaTrackPrevious') {
      e.preventDefault();
      this.player.previous();
      return;
    }
  }
}
