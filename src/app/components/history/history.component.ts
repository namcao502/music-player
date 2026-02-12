import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HistoryService, type HistoryEntry } from '../../services/history.service';
import { PlayerService } from '../../services/player.service';
import { formatDuration } from '../../services/utils/format.helpers';
import { PAGE, BTN, EMPTY, LABEL, SORT } from '../../constants/ui-strings';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoryComponent {
  readonly strings = { PAGE, BTN, EMPTY, LABEL, SORT };
  sortBy = signal<'date' | 'title' | 'artist'>('date');

  sortedHistory = computed(() => {
    const list = [...this.historyService.historyList()];
    const by = this.sortBy();
    if (by === 'date') list.sort((a, b) => b.playedAt - a.playedAt);
    else if (by === 'title') list.sort((a, b) => (a.track.title ?? '').localeCompare(b.track.title ?? '', undefined, { sensitivity: 'base' }));
    else list.sort((a, b) => (a.track.artist ?? '').localeCompare(b.track.artist ?? '', undefined, { sensitivity: 'base' }));
    return list;
  });

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

  removeEntry(entry: HistoryEntry): void {
    this.historyService.removeEntry(entry);
  }

  setSortBy(value: 'date' | 'title' | 'artist'): void {
    this.sortBy.set(value);
  }

  formatDuration = formatDuration;

  formatDate(ts: number): string {
    return new Date(ts).toLocaleString();
  }
}
