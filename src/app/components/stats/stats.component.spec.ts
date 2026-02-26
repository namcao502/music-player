import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { StatsComponent } from './stats.component';
import { HistoryService, type HistoryEntry } from '../../services/history.service';

describe('StatsComponent', () => {
  let fixture: ComponentFixture<StatsComponent>;
  let component: StatsComponent;
  let historyListSignal: ReturnType<typeof signal<HistoryEntry[]>>;
  let playCountMapSignal: ReturnType<typeof signal<Record<string, number>>>;
  let routerSpy: jasmine.SpyObj<Router>;

  const entry = (id: string, title: string, artist: string, artistId: string, duration: number): HistoryEntry => ({
    track: { id, title, artist, artistId, duration, streamUrl: 'https://s' },
    playedAt: Date.now()
  });

  beforeEach(async () => {
    historyListSignal = signal<HistoryEntry[]>([]);
    playCountMapSignal = signal<Record<string, number>>({});
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [StatsComponent],
      providers: [
        { provide: HistoryService, useValue: { historyList: historyListSignal, playCountMap: playCountMapSignal } },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StatsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ST1: hasData is false when history is empty', () => {
    historyListSignal.set([]);
    fixture.detectChanges();
    expect(component.hasData()).toBe(false);
  });

  it('ST2: totalPlays sums all play counts', () => {
    historyListSignal.set([
      entry('t1', 'Track 1', 'Artist A', 'a1', 120),
      entry('t2', 'Track 2', 'Artist B', 'b1', 180)
    ]);
    playCountMapSignal.set({ t1: 3, t2: 2 });
    fixture.detectChanges();
    expect(component.totalPlays()).toBe(5);
  });

  it('ST3: uniqueArtists counts distinct artists', () => {
    historyListSignal.set([
      entry('t1', 'Track 1', 'Artist A', 'a1', 120),
      entry('t2', 'Track 2', 'Artist A', 'a1', 100),
      entry('t3', 'Track 3', 'Artist B', 'b1', 90)
    ]);
    playCountMapSignal.set({ t1: 1, t2: 1, t3: 1 });
    fixture.detectChanges();
    expect(component.uniqueArtists()).toBe(2);
  });

  it('ST4: topTracks returns up to 5, sorted by play count desc', () => {
    historyListSignal.set([
      entry('t1', 'Low', 'A', 'a1', 60),
      entry('t2', 'High', 'B', 'b1', 60),
      entry('t3', 'Mid', 'C', 'c1', 60)
    ]);
    playCountMapSignal.set({ t1: 1, t2: 5, t3: 3 });
    fixture.detectChanges();
    const top = component.topTracks();
    expect(top.length).toBe(3);
    expect(top[0].title).toBe('High');
    expect(top[0].plays).toBe(5);
    expect(top[1].plays).toBe(3);
    expect(top[2].plays).toBe(1);
  });

  it('ST5: topArtists aggregates counts by artist', () => {
    historyListSignal.set([
      entry('t1', 'Track 1', 'Artist One', 'ao', 60),
      entry('t2', 'Track 2', 'Artist One', 'ao', 60),
      entry('t3', 'Track 3', 'Artist Two', 'at', 60)
    ]);
    playCountMapSignal.set({ t1: 2, t2: 3, t3: 1 });
    fixture.detectChanges();
    const top = component.topArtists();
    expect(top.length).toBe(2);
    const one = top.find((a) => a.name === 'Artist One');
    const two = top.find((a) => a.name === 'Artist Two');
    expect(one?.plays).toBe(5);
    expect(two?.plays).toBe(1);
  });

  it('totalListeningTime formats duration from seconds correctly', () => {
    historyListSignal.set([
      entry('t1', 'Track 1', 'A', 'a1', 120),
      entry('t2', 'Track 2', 'B', 'b1', 180)
    ]);
    playCountMapSignal.set({ t1: 2, t2: 1 }); // 120*2 + 180*1 = 420 s = 7 min
    fixture.detectChanges();
    expect(component.totalListeningTime()).toBe('7m');
  });

  it('totalListeningTime shows hours when >= 60 min', () => {
    historyListSignal.set([entry('t1', 'Track 1', 'A', 'a1', 3600)]);
    playCountMapSignal.set({ t1: 2 }); // 7200 s = 120 min = 2h 0m
    fixture.detectChanges();
    expect(component.totalListeningTime()).toBe('2h 0m');
  });

  it('navigateToArtist navigates when id is defined', () => {
    component.navigateToArtist('artist-123');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/artist', 'artist-123']);
  });

  it('navigateToArtist does nothing when id is undefined', () => {
    component.navigateToArtist(undefined);
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });
});
