import { Component } from '@angular/core';
import { HistoryService } from '../../services/history.service';
import { PlayerService } from '../../services/player.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss'
})
export class HistoryComponent {
  constructor(
    public historyService: HistoryService,
    private player: PlayerService
  ) {}

  playTrack(entry: { track: { id: string; title: string; streamUrl?: string }; playedAt: number }): void {
    const track = entry.track;
    if (!track.streamUrl) return;
    this.player.play(track as Parameters<PlayerService['play']>[0]);
  }

  clearHistory(): void {
    this.historyService.clearHistory();
  }

  formatDuration(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  formatDate(ts: number): string {
    return new Date(ts).toLocaleString();
  }
}
