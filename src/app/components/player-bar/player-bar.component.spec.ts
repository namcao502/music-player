import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PlayerBarComponent } from './player-bar.component';
import { PlayerService, type PlayableTrack } from '../../services/player.service';

const trackA: PlayableTrack = { id: 'a', title: 'A', duration: 100, streamUrl: 'https://stream/a' };
const trackB: PlayableTrack = { id: 'b', title: 'B', duration: 200, streamUrl: 'https://stream/b' };

describe('PlayerBarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerBarComponent],
      providers: [PlayerService, provideRouter([]), provideHttpClient()]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PlayerBarComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('B1: formatDuration(seconds) returns M:SS', () => {
    const fixture = TestBed.createComponent(PlayerBarComponent);
    expect(fixture.componentInstance.formatDuration(65)).toBe('1:05');
    expect(fixture.componentInstance.formatDuration(0)).toBe('0:00');
  });

  it('B2: formatDuration invalid returns 0:00', () => {
    const fixture = TestBed.createComponent(PlayerBarComponent);
    expect(fixture.componentInstance.formatDuration(NaN)).toBe('0:00');
    expect(fixture.componentInstance.formatDuration(-1)).toBe('0:00');
  });

  it('B3: coverUrl with coverArtUrl returns it', () => {
    const fixture = TestBed.createComponent(PlayerBarComponent);
    const url = fixture.componentInstance.coverUrl({ coverArtUrl: 'https://art/url' });
    expect(url).toBe('https://art/url');
  });

  it('B4: coverUrl with no coverArtUrl returns empty string', () => {
    const fixture = TestBed.createComponent(PlayerBarComponent);
    expect(fixture.componentInstance.coverUrl({})).toBe('');
  });

  it('B5: uses PlayerService', () => {
    const fixture = TestBed.createComponent(PlayerBarComponent);
    expect(fixture.componentInstance.player).toBeTruthy();
  });

  it('B6: toggleQueue toggles showQueue', () => {
    const fixture = TestBed.createComponent(PlayerBarComponent);
    expect(fixture.componentInstance.showQueue()).toBe(false);
    fixture.componentInstance.toggleQueue();
    expect(fixture.componentInstance.showQueue()).toBe(true);
    fixture.componentInstance.toggleQueue();
    expect(fixture.componentInstance.showQueue()).toBe(false);
  });

  it('B7: playFromQueue current track toggles play/pause', () => {
    const player = TestBed.inject(PlayerService);
    player.playQueue([trackA, trackB], 0);
    spyOn(player, 'togglePlayPause');
    const fixture = TestBed.createComponent(PlayerBarComponent);
    fixture.componentInstance.playFromQueue(0);
    expect(player.togglePlayPause).toHaveBeenCalled();
  });

  it('B8: playFromQueue other track plays that track', () => {
    const player = TestBed.inject(PlayerService);
    player.playQueue([trackA, trackB], 0);
    spyOn(player, 'play');
    const fixture = TestBed.createComponent(PlayerBarComponent);
    fixture.componentInstance.playFromQueue(1);
    expect(player.play).toHaveBeenCalledWith(trackB);
  });

  it('B9: isCurrentTrack returns true/false', () => {
    const player = TestBed.inject(PlayerService);
    player.playQueue([trackA, trackB], 0);
    const fixture = TestBed.createComponent(PlayerBarComponent);
    expect(fixture.componentInstance.isCurrentTrack('a')).toBe(true);
    expect(fixture.componentInstance.isCurrentTrack('b')).toBe(false);
  });

  it('B10: onQueueCoverError adds track id to queueCoverErrors', () => {
    const fixture = TestBed.createComponent(PlayerBarComponent);
    fixture.componentInstance.onQueueCoverError('id1');
    expect(fixture.componentInstance.queueCoverErrors().has('id1')).toBe(true);
  });
});
