import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { Router } from '@angular/router';
import { HistoryService } from '../../services/history.service';
import { PAGE, EMPTY, STATS } from '../../constants/ui-strings';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatsComponent {
  readonly strings = { PAGE, EMPTY, STATS };

  totalPlays = computed(() => {
    const counts = this.historyService.playCountMap();
    return Object.values(counts).reduce((sum, n) => sum + n, 0);
  });

  uniqueTracks = computed(() => this.historyService.historyList().length);

  uniqueArtists = computed(() => {
    const names = new Set<string>();
    for (const entry of this.historyService.historyList()) {
      if (entry.track.artist) names.add(entry.track.artist);
    }
    return names.size;
  });

  totalListeningTime = computed(() => {
    const counts = this.historyService.playCountMap();
    let totalSeconds = 0;
    for (const entry of this.historyService.historyList()) {
      const plays = counts[entry.track.id] ?? 1;
      totalSeconds += (entry.track.duration ?? 0) * plays;
    }
    return this.formatTime(totalSeconds);
  });

  topTracks = computed(() => {
    const counts = this.historyService.playCountMap();
    return [...this.historyService.historyList()]
      .sort((a, b) => (counts[b.track.id] ?? 0) - (counts[a.track.id] ?? 0))
      .slice(0, 5)
      .map((e) => ({
        title: e.track.title,
        artist: e.track.artist,
        artistId: e.track.artistId,
        plays: counts[e.track.id] ?? 0
      }));
  });

  topArtists = computed(() => {
    const counts = this.historyService.playCountMap();
    const artistMap = new Map<string, { name: string; id?: string; plays: number }>();
    for (const entry of this.historyService.historyList()) {
      const name = entry.track.artist;
      if (!name) continue;
      const key = entry.track.artistId ?? name;
      const existing = artistMap.get(key);
      const trackPlays = counts[entry.track.id] ?? 0;
      if (existing) {
        existing.plays += trackPlays;
      } else {
        artistMap.set(key, { name, id: entry.track.artistId, plays: trackPlays });
      }
    }
    return Array.from(artistMap.values())
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 5);
  });

  hasData = computed(() => this.historyService.historyList().length > 0);

  constructor(
    private historyService: HistoryService,
    private router: Router
  ) {}

  navigateToArtist(id: string | undefined): void {
    if (id) this.router.navigate(['/artist', id]);
  }

  private formatTime(seconds: number): string {
    const totalMinutes = Math.floor(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }
}
