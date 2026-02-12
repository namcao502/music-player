import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlaylistService } from '../../services/playlist.service';

@Component({
  selector: 'app-import',
  standalone: true,
  template: '<p style="padding:2rem;color:var(--text-secondary)">Importing playlist...</p>',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImportComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private playlistService: PlaylistService
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const tracksParam = params.get('tracks') ?? '';
    const name = params.get('name') ?? 'Imported Playlist';

    const trackIds = tracksParam.split(',').filter((id) => id.trim().length > 0);

    if (trackIds.length === 0) {
      this.router.navigate(['/playlists']);
      return;
    }

    const id = this.playlistService.importPlaylist(JSON.stringify({ name, trackIds }));
    if (id) {
      this.router.navigate(['/playlists', id]);
    } else {
      this.router.navigate(['/playlists']);
    }
  }
}
