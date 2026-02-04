import { TestBed } from '@angular/core/testing';
import { PlayerService, type PlayableTrack } from './player.service';

describe('PlayerService', () => {
  let service: PlayerService;

  const trackA: PlayableTrack = {
    id: 'a',
    title: 'Track A',
    duration: 100,
    streamUrl: 'https://stream/a'
  };
  const trackB: PlayableTrack = {
    id: 'b',
    title: 'Track B',
    duration: 200,
    streamUrl: 'https://stream/b'
  };
  const trackC: PlayableTrack = {
    id: 'c',
    title: 'Track C',
    duration: 300,
    streamUrl: 'https://stream/c'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [PlayerService] });
    service = TestBed.inject(PlayerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('P1: play(track, streamUrl) sets nowPlaying and playing', () => {
    service.play(trackA, 'https://url/a');
    expect(service.nowPlaying()).toBeTruthy();
    expect(service.nowPlaying()!.track).toEqual(trackA);
    expect(service.nowPlaying()!.streamUrl).toBe('https://url/a');
    expect(service.isPlaying()).toBe(true);
  });

  it('P2: play(track) without streamUrl does nothing when track has no streamUrl', () => {
    service.play({ id: 'x', title: 'X', duration: 0 });
    expect(service.nowPlaying()).toBeNull();
  });

  it('P3: playQueue(songs, index) sets queue and plays song at index', () => {
    service.playQueue([trackA, trackB, trackC], 1);
    expect(service.queueList().length).toBe(3);
    expect(service.nowPlaying()!.track.id).toBe('b');
  });

  it('P4: playQueue with empty array does nothing', () => {
    service.play(trackA, 'url');
    service.playQueue([], 0);
    expect(service.nowPlaying()!.track.id).toBe('a');
  });

  it('P5: togglePlayPause flips isPlaying', () => {
    service.play(trackA, 'url');
    expect(service.isPlaying()).toBe(true);
    service.togglePlayPause();
    expect(service.isPlaying()).toBe(false);
    service.togglePlayPause();
    expect(service.isPlaying()).toBe(true);
  });

  it('P6: setPlaying(value) updates isPlaying', () => {
    service.play(trackA, 'url');
    service.setPlaying(false);
    expect(service.isPlaying()).toBe(false);
  });

  it('P7: next() advances to next in queue', () => {
    service.playQueue([trackA, trackB, trackC], 0);
    service.next();
    expect(service.nowPlaying()!.track.id).toBe('b');
    service.next();
    expect(service.nowPlaying()!.track.id).toBe('c');
  });

  it('P8: next() at end of queue stops when loop=off', () => {
    service.playQueue([trackA, trackB, trackC], 2); // now c
    service.next();
    expect(service.nowPlaying()!.track.id).toBe('c');
    expect(service.isPlaying()).toBe(false);
  });

  it('P8b: next() at end wraps when loop=all', () => {
    service.playQueue([trackA, trackB, trackC], 2); // now c
    service.cycleLoopMode(); // off -> all
    service.next();
    expect(service.nowPlaying()!.track.id).toBe('a');
  });

  it('P8c: handleEnded repeats current track when loop=one', () => {
    service.playQueue([trackA, trackB, trackC], 1); // now b
    service.cycleLoopMode(); // off -> all
    service.cycleLoopMode(); // all -> one
    service.handleEnded();
    expect(service.nowPlaying()!.track.id).toBe('b');
    expect(service.isPlaying()).toBe(true);
  });

  it('P9: previous() goes to previous item in queue', () => {
    service.playQueue([trackA, trackB], 0);
    service.next(); // now b (index 1)
    service.previous();
    expect(service.nowPlaying()!.track.id).toBe('a');
  });

  it('P9b: previous() from middle goes to previous index', () => {
    service.playQueue([trackA, trackB, trackC], 2); // now c (index 2)
    service.previous();
    expect(service.nowPlaying()!.track.id).toBe('b');
  });

  it('P10b: previous() at start of queue wraps to end', () => {
    service.playQueue([trackA, trackB, trackC], 0); // now a
    service.previous();
    expect(service.nowPlaying()!.track.id).toBe('c');
  });

  it('P11: toggleShuffle flips shuffleEnabled', () => {
    expect(service.shuffleEnabled()).toBe(false);
    service.toggleShuffle();
    expect(service.shuffleEnabled()).toBe(true);
  });

  it('P12: cycleLoopMode cycles off -> all -> one -> off', () => {
    expect(service.loopMode()).toBe('off');
    service.cycleLoopMode();
    expect(service.loopMode()).toBe('all');
    service.cycleLoopMode();
    expect(service.loopMode()).toBe('one');
    service.cycleLoopMode();
    expect(service.loopMode()).toBe('off');
  });

  it('P10: registerPlaybackTrigger callback called on play', () => {
    const trigger = jasmine.createSpy('playbackTrigger');
    service.registerPlaybackTrigger(trigger);
    service.play(trackA, 'https://stream/a');
    expect(trigger).toHaveBeenCalledWith('https://stream/a', 'a');
  });
});
