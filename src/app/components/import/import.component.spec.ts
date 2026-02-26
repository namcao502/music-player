import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { ImportComponent } from './import.component';
import { PlaylistService } from '../../services/playlist.service';

describe('ImportComponent', () => {
  let playlistSpy: jasmine.SpyObj<PlaylistService>;
  let routerSpy: jasmine.SpyObj<Router>;

  function setup(tracksParam: string | null, nameParam: string | null): void {
    const paramMap = new Map<string, string | null>();
    if (tracksParam !== null) paramMap.set('tracks', tracksParam);
    if (nameParam !== null) paramMap.set('name', nameParam);

    playlistSpy = jasmine.createSpyObj('PlaylistService', ['importPlaylist']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [ImportComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => paramMap.get(key) ?? null
              }
            }
          }
        },
        { provide: Router, useValue: routerSpy },
        { provide: PlaylistService, useValue: playlistSpy }
      ]
    });
  }

  it('should create', () => {
    setup('id1,id2', 'My Playlist');
    const fixture = TestBed.createComponent(ImportComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('IM1: valid query params import playlist and redirect to playlist detail', () => {
    setup('id1,id2,id3', 'Shared Playlist');
    playlistSpy.importPlaylist.and.returnValue('pl-123');

    const fixture = TestBed.createComponent(ImportComponent);
    fixture.detectChanges();

    expect(playlistSpy.importPlaylist).toHaveBeenCalledWith(
      JSON.stringify({ name: 'Shared Playlist', trackIds: ['id1', 'id2', 'id3'] })
    );
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/playlists', 'pl-123']);
  });

  it('IM2: empty tracks param redirects to /playlists without calling importPlaylist', () => {
    setup('', 'Any Name');
    const fixture = TestBed.createComponent(ImportComponent);
    fixture.detectChanges();

    expect(playlistSpy.importPlaylist).not.toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/playlists']);
  });

  it('whitespace-only tracks param redirects to /playlists', () => {
    setup('  ,  ,  ', null);
    const fixture = TestBed.createComponent(ImportComponent);
    fixture.detectChanges();

    expect(playlistSpy.importPlaylist).not.toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/playlists']);
  });

  it('missing name param uses default "Imported Playlist"', () => {
    setup('id1', null);
    playlistSpy.importPlaylist.and.returnValue('pl-456');

    const fixture = TestBed.createComponent(ImportComponent);
    fixture.detectChanges();

    expect(playlistSpy.importPlaylist).toHaveBeenCalledWith(
      JSON.stringify({ name: 'Imported Playlist', trackIds: ['id1'] })
    );
  });

  it('when importPlaylist returns null, redirects to /playlists', () => {
    setup('id1', 'Fail');
    playlistSpy.importPlaylist.and.returnValue(null);

    const fixture = TestBed.createComponent(ImportComponent);
    fixture.detectChanges();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/playlists']);
  });
});
