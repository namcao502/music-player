import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FreeMusicComponent } from './free-music.component';
import { AudiusApiService } from '../../services/audius-api.service';
import { FreeMusicStateService } from '../../services/free-music-state.service';
import { PlaylistModalService } from '../../services/playlist-modal.service';
import { PlayerService } from '../../services/player.service';
import { PlaylistService } from '../../services/playlist.service';
import type { AudiusTrack } from '../../models/audius.models';

describe('FreeMusicComponent', () => {
  let audiusSpy: jasmine.SpyObj<AudiusApiService>;
  let playerSpy: jasmine.SpyObj<PlayerService>;
  let playlistServiceSpy: jasmine.SpyObj<PlaylistService>;
  let playlistModalSpy: jasmine.SpyObj<PlaylistModalService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockTrack: AudiusTrack = {
    id: '1',
    title: 'Test Track',
    duration: 120,
    user: { id: 'u1', name: 'Artist', handle: 'artist' }
  };

  beforeEach(async () => {
    audiusSpy = jasmine.createSpyObj('AudiusApiService', ['searchTracks', 'getArtworkUrl', 'getStreamEndpointUrl']);
    audiusSpy.searchTracks.and.returnValue(of([]));
    audiusSpy.getArtworkUrl.and.returnValue('');
    audiusSpy.getStreamEndpointUrl.and.returnValue('https://stream/1');
    playerSpy = jasmine.createSpyObj('PlayerService', ['playQueue', 'togglePlayPause', 'nowPlaying']);
    playerSpy.nowPlaying.and.returnValue(null);
    playlistServiceSpy = jasmine.createSpyObj('PlaylistService', ['addTrack', 'create'], { playlistsList: () => [] });
    playlistServiceSpy.create.and.returnValue('pl-1');
    playlistModalSpy = jasmine.createSpyObj('PlaylistModalService', ['openPrompt']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    await TestBed.configureTestingModule({
      imports: [FreeMusicComponent],
      providers: [
        { provide: AudiusApiService, useValue: audiusSpy },
        { provide: PlayerService, useValue: playerSpy },
        { provide: PlaylistService, useValue: playlistServiceSpy },
        { provide: PlaylistModalService, useValue: playlistModalSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();
    // Reset persisted state so each test starts clean
    const state = TestBed.inject(FreeMusicStateService);
    state.query.set('');
    state.tracks.set([]);
    state.page.set(1);
    state.hasNextPage.set(false);
    state.brokenCoverIds.set(new Set());
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(FreeMusicComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('F1: initial state empty query, no tracks, no error', () => {
    const fixture = TestBed.createComponent(FreeMusicComponent);
    expect(fixture.componentInstance.query()).toBe('');
    expect(fixture.componentInstance.tracks()).toEqual([]);
    expect(fixture.componentInstance.error()).toBe('');
  });

  it('F2: onSearch with empty query does nothing', () => {
    const fixture = TestBed.createComponent(FreeMusicComponent);
    fixture.componentInstance.onSearch();
    expect(audiusSpy.searchTracks).not.toHaveBeenCalled();
  });

  it('F3: onSearch with query calls audius.searchTracks', () => {
    const fixture = TestBed.createComponent(FreeMusicComponent);
    fixture.componentInstance.query.set('test');
    fixture.componentInstance.onSearch();
    expect(audiusSpy.searchTracks).toHaveBeenCalledWith('test', 24, 0);
  });

  it('F4: onSearch success sets tracks and clears loading', fakeAsync(() => {
    audiusSpy.searchTracks.and.returnValue(of([mockTrack]));
    const fixture = TestBed.createComponent(FreeMusicComponent);
    fixture.componentInstance.query.set('test');
    fixture.componentInstance.onSearch();
    tick();
    expect(fixture.componentInstance.tracks()).toEqual([mockTrack]);
    expect(fixture.componentInstance.loading()).toBe(false);
  }));

  it('F5: onSearch error sets error message and clears loading', fakeAsync(() => {
    audiusSpy.searchTracks.and.returnValue(throwError(() => new Error('fail')));
    const fixture = TestBed.createComponent(FreeMusicComponent);
    fixture.componentInstance.query.set('test');
    fixture.componentInstance.onSearch();
    tick();
    expect(fixture.componentInstance.error()).toContain('Search failed');
    expect(fixture.componentInstance.loading()).toBe(false);
  }));

  it('F6: runRecentSearch sets query and triggers search', () => {
    const fixture = TestBed.createComponent(FreeMusicComponent);
    fixture.componentInstance.runRecentSearch('jazz');
    expect(fixture.componentInstance.query()).toBe('jazz');
    expect(audiusSpy.searchTracks).toHaveBeenCalledWith('jazz', 24, 0);
  });

  it('F7: play(track) calls player.playQueue with playables and index', () => {
    audiusSpy.searchTracks.and.returnValue(of([mockTrack]));
    const fixture = TestBed.createComponent(FreeMusicComponent);
    fixture.componentInstance.query.set('q');
    fixture.componentInstance.onSearch();
    fixture.detectChanges();
    fixture.componentInstance.play(mockTrack);
    expect(playerSpy.playQueue).toHaveBeenCalled();
    const [playables, index] = playerSpy.playQueue.calls.mostRecent().args;
    expect(playables.length).toBe(1);
    expect(playables[0].id).toBe('1');
    expect(index).toBe(0);
  });

  it('F8: formatDuration returns M:SS', () => {
    const fixture = TestBed.createComponent(FreeMusicComponent);
    expect(fixture.componentInstance.formatDuration(90)).toBe('1:30');
    expect(fixture.componentInstance.formatDuration(5)).toBe('0:05');
  });

  it('F9: ngOnInit loads recent searches from localStorage', () => {
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(['a', 'b']));
    const fixture = TestBed.createComponent(FreeMusicComponent);
    fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.recentSearches()).toEqual(['a', 'b']);
  });

  it('F10: onTrackClick same track toggles play/pause', () => {
    playerSpy.nowPlaying.and.returnValue({ track: mockTrack, streamUrl: 'https://stream/1' });
    const fixture = TestBed.createComponent(FreeMusicComponent);
    fixture.componentInstance.onTrackClick(mockTrack);
    expect(playerSpy.togglePlayPause).toHaveBeenCalled();
    expect(playerSpy.playQueue).not.toHaveBeenCalled();
  });

  it('F11: onTrackClick different track calls play', () => {
    audiusSpy.searchTracks.and.returnValue(of([mockTrack]));
    playerSpy.nowPlaying.and.returnValue({ track: { ...mockTrack, id: 'other' }, streamUrl: 'x' });
    const fixture = TestBed.createComponent(FreeMusicComponent);
    fixture.componentInstance.query.set('q');
    fixture.componentInstance.onSearch();
    fixture.detectChanges();
    fixture.componentInstance.onTrackClick(mockTrack);
    expect(playerSpy.playQueue).toHaveBeenCalled();
  });

  it('F12: Pagination onSearch resets page to 1', fakeAsync(() => {
    audiusSpy.searchTracks.and.returnValue(of([mockTrack]));
    const fixture = TestBed.createComponent(FreeMusicComponent);
    fixture.componentInstance.query.set('test');
    fixture.componentInstance.onSearch();
    tick();
    expect(fixture.componentInstance.page()).toBe(1);
    expect(audiusSpy.searchTracks).toHaveBeenCalledWith('test', 24, 0);
  }));

  it('F13: Pagination goToNextPage loads next offset', fakeAsync(() => {
    const manyTracks = Array(24).fill(null).map((_, i) => ({ ...mockTrack, id: String(i) }));
    audiusSpy.searchTracks.and.returnValue(of(manyTracks));
    const fixture = TestBed.createComponent(FreeMusicComponent);
    fixture.componentInstance.query.set('test');
    fixture.componentInstance.onSearch();
    tick();
    audiusSpy.searchTracks.calls.reset();
    audiusSpy.searchTracks.and.returnValue(of([]));
    fixture.componentInstance.goToNextPage();
    expect(fixture.componentInstance.page()).toBe(2);
    expect(audiusSpy.searchTracks).toHaveBeenCalledWith('test', 24, 24);
  }));

  it('F14: onCoverError adds track id to brokenCoverIds', () => {
    const fixture = TestBed.createComponent(FreeMusicComponent);
    fixture.componentInstance.onCoverError('id1');
    expect(fixture.componentInstance.brokenCoverIds().has('id1')).toBe(true);
  });

  it('F15: openAddToPlaylist toggles dropdown for track', () => {
    const fixture = TestBed.createComponent(FreeMusicComponent);
    const ev = new Event('click', { bubbles: true });
    spyOn(ev, 'stopPropagation');
    expect(fixture.componentInstance.addToPlaylistTrackId()).toBeNull();
    fixture.componentInstance.openAddToPlaylist('tid1', ev);
    expect(ev.stopPropagation).toHaveBeenCalled();
    expect(fixture.componentInstance.addToPlaylistTrackId()).toBe('tid1');
    fixture.componentInstance.openAddToPlaylist('tid1', ev);
    expect(fixture.componentInstance.addToPlaylistTrackId()).toBeNull();
  });

  it('F16: addTrackToPlaylist calls playlistService and closes dropdown', () => {
    const fixture = TestBed.createComponent(FreeMusicComponent);
    fixture.componentInstance.addToPlaylistTrackId.set('tid1');
    fixture.componentInstance.addTrackToPlaylist('pid1', 'tid1');
    expect(playlistServiceSpy.addTrack).toHaveBeenCalledWith('pid1', 'tid1');
    expect(fixture.componentInstance.addToPlaylistTrackId()).toBeNull();
  });

  it('F17: State restore from FreeMusicStateService on init', () => {
    const state = TestBed.inject(FreeMusicStateService);
    state.query.set('saved');
    state.tracks.set([mockTrack]);
    state.page.set(2);
    state.hasNextPage.set(true);
    state.brokenCoverIds.set(new Set(['b1']));
    const fixture = TestBed.createComponent(FreeMusicComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.query()).toBe('saved');
    expect(fixture.componentInstance.tracks()).toEqual([mockTrack]);
    expect(fixture.componentInstance.page()).toBe(2);
    expect(fixture.componentInstance.hasNextPage()).toBe(true);
    expect(fixture.componentInstance.brokenCoverIds().has('b1')).toBe(true);
  });

  it('F18: goToPrevPage decrements page and loads previous offset', fakeAsync(() => {
    const manyTracks = Array(24).fill(null).map((_, i) => ({ ...mockTrack, id: String(i) }));
    audiusSpy.searchTracks.and.returnValue(of(manyTracks));
    const fixture = TestBed.createComponent(FreeMusicComponent);
    fixture.componentInstance.query.set('test');
    fixture.componentInstance.onSearch();
    tick();
    fixture.componentInstance.goToNextPage();
    tick();
    audiusSpy.searchTracks.calls.reset();
    audiusSpy.searchTracks.and.returnValue(of([]));
    fixture.componentInstance.goToPrevPage();
    expect(fixture.componentInstance.page()).toBe(1);
    expect(audiusSpy.searchTracks).toHaveBeenCalledWith('test', 24, 0);
  }));

  it('F19: createPlaylistAndAddTrack when modal returns name creates playlist, adds track, navigates', fakeAsync(() => {
    playlistModalSpy.openPrompt.and.returnValue(Promise.resolve('My List'));
    const fixture = TestBed.createComponent(FreeMusicComponent);
    fixture.componentInstance.createPlaylistAndAddTrack('tid1');
    tick();
    expect(playlistServiceSpy.create).toHaveBeenCalledWith('My List');
    expect(playlistServiceSpy.addTrack).toHaveBeenCalledWith('pl-1', 'tid1');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/playlists', 'pl-1']);
    expect(fixture.componentInstance.addToPlaylistTrackId()).toBeNull();
  }));

  it('F19b: createPlaylistAndAddTrack when modal returns null does nothing', fakeAsync(() => {
    playlistModalSpy.openPrompt.and.returnValue(Promise.resolve(null));
    const fixture = TestBed.createComponent(FreeMusicComponent);
    fixture.componentInstance.createPlaylistAndAddTrack('tid1');
    tick();
    expect(playlistServiceSpy.create).not.toHaveBeenCalled();
    expect(playlistServiceSpy.addTrack).not.toHaveBeenCalled();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  }));

  it('F20: onDocumentClick closes add-to-playlist dropdown', () => {
    const fixture = TestBed.createComponent(FreeMusicComponent);
    fixture.componentInstance.addToPlaylistTrackId.set('tid1');
    fixture.componentInstance.onDocumentClick();
    expect(fixture.componentInstance.addToPlaylistTrackId()).toBeNull();
  });
});
