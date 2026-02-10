import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PlaylistService } from './playlist.service';
import { AudiusApiService } from './audius-api.service';
import { PLAYLISTS_STORAGE_KEY } from '../models/playlist.model';
import type { AudiusTrack } from '../models/audius.models';

describe('PlaylistService', () => {
  let service: PlaylistService;
  let audiusSpy: jasmine.SpyObj<AudiusApiService>;
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    spyOn(Storage.prototype, 'getItem').and.callFake((key: string) => store[key] ?? null);
    spyOn(Storage.prototype, 'setItem').and.callFake((key: string, value: string) => {
      store[key] = value;
    });

    audiusSpy = jasmine.createSpyObj('AudiusApiService', ['getTrackById', 'getArtworkUrl', 'getStreamEndpointUrl']);
    audiusSpy.getArtworkUrl.and.returnValue('https://art');
    audiusSpy.getStreamEndpointUrl.and.returnValue('https://stream');

    TestBed.configureTestingModule({
      providers: [
        PlaylistService,
        { provide: AudiusApiService, useValue: audiusSpy }
      ]
    });
    service = TestBed.inject(PlaylistService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('PL1: loadFromStorage loads from localStorage', () => {
    const data = [{ id: 'pl-1', name: 'Test', trackIds: ['t1'] }];
    store[PLAYLISTS_STORAGE_KEY] = JSON.stringify(data);
    service.loadFromStorage();
    expect(service.playlistsList().length).toBe(1);
    expect(service.playlistsList()[0].name).toBe('Test');
  });

  it('PL2: loadFromStorage handles invalid/missing data', () => {
    store[PLAYLISTS_STORAGE_KEY] = 'not-json';
    service.loadFromStorage();
    expect(service.playlistsList()).toEqual([]);
  });

  it('PL2b: loadFromStorage handles missing key', () => {
    service.loadFromStorage();
    expect(service.playlistsList()).toEqual([]);
  });

  it('PL3: create(name) adds playlist and saves', () => {
    const id = service.create('My List');
    expect(id).toContain('pl-');
    expect(service.playlistsList().length).toBe(1);
    expect(service.playlistsList()[0].name).toBe('My List');
    expect(store[PLAYLISTS_STORAGE_KEY]).toBeTruthy();
  });

  it('PL4: create with empty name falls back to Playlist', () => {
    service.create('');
    expect(service.playlistsList()[0].name).toBe('Playlist');
  });

  it('PL5: rename(id, name) updates name', () => {
    const id = service.create('Old');
    service.rename(id, 'New');
    expect(service.getPlaylist(id)!.name).toBe('New');
  });

  it('PL6: rename with empty name keeps old name', () => {
    const id = service.create('Keep');
    service.rename(id, '  ');
    expect(service.getPlaylist(id)!.name).toBe('Keep');
  });

  it('PL7: delete(id) removes playlist', () => {
    const id = service.create('Del');
    expect(service.playlistsList().length).toBe(1);
    service.delete(id);
    expect(service.playlistsList().length).toBe(0);
  });

  it('PL8: addTrack appends trackId if not present', () => {
    const id = service.create('P');
    service.addTrack(id, 't1');
    expect(service.getPlaylist(id)!.trackIds).toEqual(['t1']);
  });

  it('PL9: addTrack does not duplicate', () => {
    const id = service.create('P');
    service.addTrack(id, 't1');
    service.addTrack(id, 't1');
    expect(service.getPlaylist(id)!.trackIds).toEqual(['t1']);
  });

  it('PL10: removeTrack removes trackId', () => {
    const id = service.create('P');
    service.addTrack(id, 't1');
    service.addTrack(id, 't2');
    service.removeTrack(id, 't1');
    expect(service.getPlaylist(id)!.trackIds).toEqual(['t2']);
  });

  it('PL11: getPlaylist returns correct playlist or undefined', () => {
    const id = service.create('Find');
    expect(service.getPlaylist(id)).toBeTruthy();
    expect(service.getPlaylist('nonexistent')).toBeUndefined();
  });

  it('PL12: getPlayableTracks resolves via API', (done) => {
    const track: AudiusTrack = { id: 't1', title: 'Track 1', duration: 120, user: { id: 'u1', name: 'Artist', handle: 'a' } };
    audiusSpy.getTrackById.and.returnValue(of(track));

    const id = service.create('P');
    service.addTrack(id, 't1');
    service.getPlayableTracks(id).subscribe((playables) => {
      expect(playables.length).toBe(1);
      expect(playables[0].id).toBe('t1');
      expect(playables[0].title).toBe('Track 1');
      expect(playables[0].artist).toBe('Artist');
      expect(playables[0].streamUrl).toBe('https://stream');
      done();
    });
  });

  it('PL12b: getPlayableTracks skips null tracks', (done) => {
    audiusSpy.getTrackById.and.returnValue(of(null));

    const id = service.create('P');
    service.addTrack(id, 't1');
    service.getPlayableTracks(id).subscribe((playables) => {
      expect(playables.length).toBe(0);
      done();
    });
  });

  it('PL13: getPlayableTracks for empty playlist returns []', (done) => {
    const id = service.create('Empty');
    service.getPlayableTracks(id).subscribe((playables) => {
      expect(playables).toEqual([]);
      expect(audiusSpy.getTrackById).not.toHaveBeenCalled();
      done();
    });
  });

  it('PL13b: getPlayableTracks for nonexistent playlist returns []', (done) => {
    service.getPlayableTracks('nonexistent').subscribe((playables) => {
      expect(playables).toEqual([]);
      done();
    });
  });
});
