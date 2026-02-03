import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { FreeMusicComponent } from './free-music.component';
import { AudiusApiService } from '../../services/audius-api.service';
import { PlayerService } from '../../services/player.service';
import type { AudiusTrack } from '../../models/audius.models';

describe('FreeMusicComponent', () => {
  let audiusSpy: jasmine.SpyObj<AudiusApiService>;
  let playerSpy: jasmine.SpyObj<PlayerService>;

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
    playerSpy = jasmine.createSpyObj('PlayerService', ['playQueue']);
    await TestBed.configureTestingModule({
      imports: [FreeMusicComponent],
      providers: [
        { provide: AudiusApiService, useValue: audiusSpy },
        { provide: PlayerService, useValue: playerSpy }
      ]
    }).compileComponents();
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
    expect(audiusSpy.searchTracks).toHaveBeenCalledWith('test', 24);
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
    expect(audiusSpy.searchTracks).toHaveBeenCalledWith('jazz', 24);
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
});
