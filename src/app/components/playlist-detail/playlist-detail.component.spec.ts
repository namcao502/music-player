import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { PlaylistDetailComponent } from './playlist-detail.component';
import { PlaylistService } from '../../services/playlist.service';
import { AudiusApiService } from '../../services/audius-api.service';
import { PlayerService, type PlayableTrack } from '../../services/player.service';
import { PlaylistModalService } from '../../services/playlist-modal.service';
import type { AudiusTrack } from '../../models/audius.models';

describe('PlaylistDetailComponent', () => {
  let playlistSpy: jasmine.SpyObj<PlaylistService>;
  let audiusSpy: jasmine.SpyObj<AudiusApiService>;
  let playerSpy: jasmine.SpyObj<PlayerService>;
  let modalSpy: jasmine.SpyObj<PlaylistModalService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockTrack: AudiusTrack = { id: 't1', title: 'Track 1', duration: 120, user: { id: 'u1', name: 'Artist', handle: 'a' } };
  const mockPlayable: PlayableTrack = { id: 't1', title: 'Track 1', duration: 120, streamUrl: 'https://s' };
  const mockPlaylist = { id: 'pl-1', name: 'My List', trackIds: ['t1'] };

  function setup(paramId: string | null = 'pl-1', playlistExists = true): void {
    playlistSpy = jasmine.createSpyObj('PlaylistService', ['getPlaylist', 'getPlayableTracks', 'removeTrack', 'rename', 'delete']);
    playlistSpy.getPlaylist.and.returnValue(playlistExists ? { ...mockPlaylist } : undefined);
    playlistSpy.getPlayableTracks.and.returnValue(of([mockPlayable]));

    audiusSpy = jasmine.createSpyObj('AudiusApiService', ['getTrackById', 'getArtworkUrl']);
    audiusSpy.getTrackById.and.returnValue(of(mockTrack));
    audiusSpy.getArtworkUrl.and.returnValue('https://art');

    playerSpy = jasmine.createSpyObj('PlayerService', ['playQueue']);
    modalSpy = jasmine.createSpyObj('PlaylistModalService', ['openPrompt', 'openConfirm']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [PlaylistDetailComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => paramId } } } },
        { provide: Router, useValue: routerSpy },
        { provide: PlaylistService, useValue: playlistSpy },
        { provide: AudiusApiService, useValue: audiusSpy },
        { provide: PlayerService, useValue: playerSpy },
        { provide: PlaylistModalService, useValue: modalSpy }
      ]
    });
  }

  it('should create', () => {
    setup();
    const fixture = TestBed.createComponent(PlaylistDetailComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('PD1: init with valid id loads playlist and tracks', fakeAsync(() => {
    setup('pl-1', true);
    const fixture = TestBed.createComponent(PlaylistDetailComponent);
    fixture.detectChanges();
    tick();
    expect(fixture.componentInstance.playlist()?.id).toBe('pl-1');
    expect(audiusSpy.getTrackById).toHaveBeenCalledWith('t1');
    expect(fixture.componentInstance.tracks().length).toBe(1);
  }));

  it('PD2: init with missing id redirects to /playlists', () => {
    setup(null);
    const fixture = TestBed.createComponent(PlaylistDetailComponent);
    fixture.detectChanges();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/playlists']);
  });

  it('PD3: init with unknown playlist id redirects', () => {
    setup('nonexistent', false);
    const fixture = TestBed.createComponent(PlaylistDetailComponent);
    fixture.detectChanges();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/playlists']);
  });

  it('PD4: play() resolves and plays queue', fakeAsync(() => {
    setup();
    const fixture = TestBed.createComponent(PlaylistDetailComponent);
    fixture.detectChanges();
    tick();
    fixture.componentInstance.play();
    expect(playlistSpy.getPlayableTracks).toHaveBeenCalledWith('pl-1');
    expect(playerSpy.playQueue).toHaveBeenCalledWith([mockPlayable], 0);
  }));

  it('PD5: removeTrack removes and updates local state', fakeAsync(() => {
    setup();
    const fixture = TestBed.createComponent(PlaylistDetailComponent);
    fixture.detectChanges();
    tick();
    expect(fixture.componentInstance.tracks().length).toBe(1);

    // After removeTrack, getPlaylist returns updated playlist without the track
    playlistSpy.getPlaylist.and.returnValue({ id: 'pl-1', name: 'My List', trackIds: [] });
    fixture.componentInstance.removeTrack('t1');
    expect(playlistSpy.removeTrack).toHaveBeenCalledWith('pl-1', 't1');
    expect(fixture.componentInstance.tracks().length).toBe(0);
  }));

  it('PD6: rename opens prompt, updates service and local signal', fakeAsync(() => {
    setup();
    modalSpy.openPrompt.and.returnValue(Promise.resolve('New Name'));
    const fixture = TestBed.createComponent(PlaylistDetailComponent);
    fixture.detectChanges();
    tick();

    fixture.componentInstance.rename();
    tick();
    expect(modalSpy.openPrompt).toHaveBeenCalledWith('Rename playlist', 'My List');
    expect(playlistSpy.rename).toHaveBeenCalledWith('pl-1', 'New Name');
    expect(fixture.componentInstance.playlist()?.name).toBe('New Name');
  }));

  it('PD6b: rename with null does nothing', fakeAsync(() => {
    setup();
    modalSpy.openPrompt.and.returnValue(Promise.resolve(null));
    const fixture = TestBed.createComponent(PlaylistDetailComponent);
    fixture.detectChanges();
    tick();

    fixture.componentInstance.rename();
    tick();
    expect(playlistSpy.rename).not.toHaveBeenCalled();
  }));

  it('PD7: deletePlaylist confirms, deletes, navigates', fakeAsync(() => {
    setup();
    modalSpy.openConfirm.and.returnValue(Promise.resolve(true));
    const fixture = TestBed.createComponent(PlaylistDetailComponent);
    fixture.detectChanges();
    tick();

    fixture.componentInstance.deletePlaylist();
    tick();
    expect(playlistSpy.delete).toHaveBeenCalledWith('pl-1');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/playlists']);
  }));

  it('PD8: deletePlaylist cancelled does nothing', fakeAsync(() => {
    setup();
    modalSpy.openConfirm.and.returnValue(Promise.resolve(false));
    const fixture = TestBed.createComponent(PlaylistDetailComponent);
    fixture.detectChanges();
    tick();

    fixture.componentInstance.deletePlaylist();
    tick();
    expect(playlistSpy.delete).not.toHaveBeenCalled();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  }));

  it('PD9: back() navigates to /playlists', fakeAsync(() => {
    setup();
    const fixture = TestBed.createComponent(PlaylistDetailComponent);
    fixture.detectChanges();
    tick();

    fixture.componentInstance.back();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/playlists']);
  }));
});
