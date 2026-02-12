import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HistoryService, type HistoryEntry } from '../../services/history.service';
import { PlayerService } from '../../services/player.service';
import { formatDuration } from '../../services/utils/format.helpers';
import { NotificationService } from '../../services/utils/notification.service';
import { PAGE, BTN, EMPTY, LABEL, SORT, PLACEHOLDER, TOAST, SECTION } from '../../constants/ui-strings';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoryComponent {
  readonly strings = { PAGE, BTN, EMPTY, LABEL, SORT, PLACEHOLDER, TOAST, SECTION };
  sortBy = signal<'date' | 'title' | 'artist'>('date');
  filterText = signal('');

  recentArtists = computed(() => {
    const seen = new Map<string, string>();
    for (const entry of this.historyService.historyList()) {
      const id = entry.track.artistId;
      const name = entry.track.artist;
      if (id && name && !seen.has(id)) {
        seen.set(id, name);
        if (seen.size >= 10) break;
      }
    }
    return Array.from(seen, ([id, name]) => ({ id, name }));
  });

  sortedHistory = computed(() => {
    let list = [...this.historyService.historyList()];
    const query = this.filterText().toLowerCase().trim();
    if (query) {
      list = list.filter((e) =>
        e.track.title.toLowerCase().includes(query) ||
        (e.track.artist ?? '').toLowerCase().includes(query)
      );
    }
    const by = this.sortBy();
    if (by === 'date') list.sort((a, b) => b.playedAt - a.playedAt);
    else if (by === 'title') list.sort((a, b) => (a.track.title ?? '').localeCompare(b.track.title ?? '', undefined, { sensitivity: 'base' }));
    else list.sort((a, b) => (a.track.artist ?? '').localeCompare(b.track.artist ?? '', undefined, { sensitivity: 'base' }));
    return list;
  });

  constructor(
    public historyService: HistoryService,
    private player: PlayerService,
    private notification: NotificationService,
    private router: Router
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

  addToQueue(entry: HistoryEntry, e: Event): void {
    e.stopPropagation();
    this.player.addToQueue(entry.track);
    this.notification.success(TOAST.ADDED_TO_QUEUE);
  }

  navigateToArtist(id: string): void {
    this.router.navigate(['/artist', id]);
  }

  formatDuration = formatDuration;

  formatDate(ts: number): string {
    return new Date(ts).toLocaleString();
  }
}
