import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HistoryService, type HistoryEntry } from '../../services/history.service';
import { PlayerService, type PlayableTrack } from '../../services/player.service';
import { formatDuration } from '../../services/utils/format.helpers';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoryComponent {
  constructor(
    public historyService: HistoryService,
    private player: PlayerService
  ) {}

  playTrack(entry: HistoryEntry): void {
    if (!entry.track.streamUrl) return;
    this.player.play(entry.track);
  }

  clearHistory(): void {
    this.historyService.clearHistory();
  }

  formatDuration = formatDuration;

  formatDate(ts: number): string {
    return new Date(ts).toLocaleString();
  }
}
