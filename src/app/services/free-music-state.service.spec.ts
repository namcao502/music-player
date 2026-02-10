import { TestBed } from '@angular/core/testing';
import { FreeMusicStateService } from './free-music-state.service';

describe('FreeMusicStateService', () => {
  let service: FreeMusicStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [FreeMusicStateService] });
    service = TestBed.inject(FreeMusicStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have empty default state', () => {
    expect(service.query()).toBe('');
    expect(service.tracks()).toEqual([]);
    expect(service.page()).toBe(1);
    expect(service.hasNextPage()).toBeFalse();
    expect(service.brokenCoverIds().size).toBe(0);
  });

  it('should store and retrieve query', () => {
    service.query.set('test query');
    expect(service.query()).toBe('test query');
  });

  it('should store and retrieve tracks', () => {
    const tracks: any[] = [{ id: 't1', title: 'Track 1', duration: 180, user: { id: 'u1', name: 'A', handle: 'a' } }];
    service.tracks.set(tracks);
    expect(service.tracks().length).toBe(1);
    expect(service.tracks()[0].id).toBe('t1');
  });

  it('should store and retrieve page', () => {
    service.page.set(3);
    expect(service.page()).toBe(3);
  });

  it('should store and retrieve hasNextPage', () => {
    service.hasNextPage.set(true);
    expect(service.hasNextPage()).toBeTrue();
  });

  it('should store and retrieve brokenCoverIds', () => {
    service.brokenCoverIds.set(new Set(['t1', 't2']));
    expect(service.brokenCoverIds().has('t1')).toBeTrue();
    expect(service.brokenCoverIds().has('t2')).toBeTrue();
    expect(service.brokenCoverIds().size).toBe(2);
  });
});
