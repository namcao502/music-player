import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { PlaylistListComponent } from './playlist-list.component';
import { PlaylistService } from '../../services/playlist.service';
import { PlayerService, type PlayableTrack } from '../../services/player.service';
import { PlaylistModalService } from '../../services/playlist-modal.service';

describe('PlaylistListComponent', () => {
  let playlistSpy: jasmine.SpyObj<PlaylistService>;
  let playerSpy: jasmine.SpyObj<PlayerService>;
  let modalSpy: jasmine.SpyObj<PlaylistModalService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockPlayable: PlayableTrack = { id: 't1', title: 'T', duration: 100, streamUrl: 'https://s' };

  beforeEach(async () => {
    playlistSpy = jasmine.createSpyObj('PlaylistService', ['create', 'rename', 'delete', 'getPlayableTracks'], {
      playlistsList: () => [{ id: 'pl-1', name: 'My List', trackIds: ['t1'] }]
    });
    playlistSpy.create.and.returnValue('pl-new');
    playlistSpy.getPlayableTracks.and.returnValue(of([mockPlayable]));

    playerSpy = jasmine.createSpyObj('PlayerService', ['playQueue']);
    modalSpy = jasmine.createSpyObj('PlaylistModalService', ['openPrompt', 'openConfirm']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [PlaylistListComponent],
      providers: [
        { provide: PlaylistService, useValue: playlistSpy },
        { provide: PlayerService, useValue: playerSpy },
        { provide: PlaylistModalService, useValue: modalSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PlaylistListComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('LL1: renders playlist list from service', () => {
    const fixture = TestBed.createComponent(PlaylistListComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.item-name')?.textContent).toContain('My List');
  });

  it('LL2: createPlaylist opens prompt, creates, navigates', fakeAsync(() => {
    modalSpy.openPrompt.and.returnValue(Promise.resolve('New'));
    const fixture = TestBed.createComponent(PlaylistListComponent);
    fixture.componentInstance.createPlaylist();
    tick();
    expect(playlistSpy.create).toHaveBeenCalledWith('New');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/playlists', 'pl-new']);
  }));

  it('LL3: createPlaylist cancelled does nothing', fakeAsync(() => {
    modalSpy.openPrompt.and.returnValue(Promise.resolve(null));
    const fixture = TestBed.createComponent(PlaylistListComponent);
    fixture.componentInstance.createPlaylist();
    tick();
    expect(playlistSpy.create).not.toHaveBeenCalled();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  }));

  it('LL4: play(id) resolves tracks and calls playQueue', () => {
    const fixture = TestBed.createComponent(PlaylistListComponent);
    fixture.componentInstance.play('pl-1');
    expect(playlistSpy.getPlayableTracks).toHaveBeenCalledWith('pl-1');
    expect(playerSpy.playQueue).toHaveBeenCalledWith([mockPlayable], 0);
  });

  it('LL5: play(id) with empty tracks does nothing', () => {
    playlistSpy.getPlayableTracks.and.returnValue(of([]));
    const fixture = TestBed.createComponent(PlaylistListComponent);
    fixture.componentInstance.play('pl-1');
    expect(playerSpy.playQueue).not.toHaveBeenCalled();
  });

  it('LL6: rename opens prompt, calls service', fakeAsync(() => {
    modalSpy.openPrompt.and.returnValue(Promise.resolve('Renamed'));
    const fixture = TestBed.createComponent(PlaylistListComponent);
    fixture.componentInstance.rename({ id: 'pl-1', name: 'Old' });
    tick();
    expect(playlistSpy.rename).toHaveBeenCalledWith('pl-1', 'Renamed');
  }));

  it('LL6b: rename with empty result does not call service', fakeAsync(() => {
    modalSpy.openPrompt.and.returnValue(Promise.resolve('  '));
    const fixture = TestBed.createComponent(PlaylistListComponent);
    fixture.componentInstance.rename({ id: 'pl-1', name: 'Old' });
    tick();
    expect(playlistSpy.rename).not.toHaveBeenCalled();
  }));

  it('LL7: delete opens confirm, calls service', fakeAsync(() => {
    modalSpy.openConfirm.and.returnValue(Promise.resolve(true));
    const fixture = TestBed.createComponent(PlaylistListComponent);
    fixture.componentInstance.delete('pl-1', 'My List');
    tick();
    expect(modalSpy.openConfirm).toHaveBeenCalledWith('Delete "My List"?', 'Delete');
    expect(playlistSpy.delete).toHaveBeenCalledWith('pl-1');
  }));

  it('LL8: delete cancelled does nothing', fakeAsync(() => {
    modalSpy.openConfirm.and.returnValue(Promise.resolve(false));
    const fixture = TestBed.createComponent(PlaylistListComponent);
    fixture.componentInstance.delete('pl-1', 'My List');
    tick();
    expect(playlistSpy.delete).not.toHaveBeenCalled();
  }));

  it('LL9: open(id) navigates to detail', () => {
    const fixture = TestBed.createComponent(PlaylistListComponent);
    fixture.componentInstance.open('pl-1');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/playlists', 'pl-1']);
  });
});
