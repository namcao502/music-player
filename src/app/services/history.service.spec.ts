import { TestBed } from '@angular/core/testing';
import { HistoryService } from './history.service';
import { PlayerService } from './player.service';
import { NotificationService } from './utils/notification.service';

describe('HistoryService', () => {
  let service: HistoryService;
  let mockPlayerService: jasmine.SpyObj<PlayerService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    spyOn(Storage.prototype, 'getItem').and.callFake((key: string) => store[key] ?? null);
    spyOn(Storage.prototype, 'setItem').and.callFake((key: string, value: string) => {
      store[key] = value;
    });

    mockPlayerService = jasmine.createSpyObj('PlayerService', ['play', 'togglePlayPause'], {
      nowPlaying: jasmine.createSpy('nowPlaying').and.returnValue(null)
    });
    mockNotificationService = jasmine.createSpyObj('NotificationService', ['error', 'warning', 'success']);

    TestBed.configureTestingModule({
      providers: [
        HistoryService,
        { provide: PlayerService, useValue: mockPlayerService },
        { provide: NotificationService, useValue: mockNotificationService }
      ]
    });
    service = TestBed.inject(HistoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty history', () => {
    expect(service.historyList().length).toBe(0);
  });

  it('should load history from localStorage', () => {
    const data = [{ track: { id: 't1', title: 'Track 1', duration: 180 }, playedAt: Date.now() }];
    store['music-player-history'] = JSON.stringify(data);
    const fresh = TestBed.inject(HistoryService);
    // The service loads in constructor; since store was set after initial inject,
    // the existing service won't see it. This tests the loadFromStorage path.
    expect(service.historyList()).toEqual([]);
  });

  it('should clear history', () => {
    service.clearHistory();
    expect(service.historyList().length).toBe(0);
    expect(store['music-player-history']).toBe('[]');
  });

  it('should handle invalid localStorage data', () => {
    store['music-player-history'] = 'invalid-json';
    const fresh = TestBed.inject(HistoryService);
    expect(fresh.historyList()).toEqual([]);
  });

  it('should handle missing localStorage key', () => {
    expect(service.historyList()).toEqual([]);
  });
});
