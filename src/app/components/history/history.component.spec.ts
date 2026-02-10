import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistoryComponent } from './history.component';
import { HistoryService, type HistoryEntry } from '../../services/history.service';
import { PlayerService } from '../../services/player.service';
import { signal } from '@angular/core';

describe('HistoryComponent', () => {
  let component: HistoryComponent;
  let fixture: ComponentFixture<HistoryComponent>;
  let mockHistoryService: jasmine.SpyObj<HistoryService>;
  let mockPlayerService: jasmine.SpyObj<PlayerService>;

  beforeEach(async () => {
    mockHistoryService = jasmine.createSpyObj('HistoryService', ['clearHistory'], {
      historyList: signal<HistoryEntry[]>([
        {
          track: {
            id: 'track1',
            title: 'Track 1',
            artist: 'Artist 1',
            duration: 180,
            streamUrl: 'https://example.com/stream1'
          },
          playedAt: Date.now()
        },
        {
          track: {
            id: 'track2',
            title: 'Track 2',
            artist: 'Artist 2',
            duration: 240,
            streamUrl: 'https://example.com/stream2'
          },
          playedAt: Date.now() - 1000
        }
      ])
    });
    mockPlayerService = jasmine.createSpyObj('PlayerService', ['play']);

    await TestBed.configureTestingModule({
      imports: [HistoryComponent],
      providers: [
        { provide: HistoryService, useValue: mockHistoryService },
        { provide: PlayerService, useValue: mockPlayerService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HistoryComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should play a track from history', () => {
    const entry: HistoryEntry = {
      track: {
        id: 'track1',
        title: 'Track 1',
        artist: 'Artist 1',
        duration: 180,
        streamUrl: 'https://example.com/stream1'
      },
      playedAt: Date.now()
    };

    component.playTrack(entry);

    expect(mockPlayerService.play).toHaveBeenCalledWith(entry.track);
  });

  it('should not play track without stream URL', () => {
    const entry: HistoryEntry = {
      track: {
        id: 'track1',
        title: 'Track 1',
        artist: 'Artist 1',
        duration: 180
      },
      playedAt: Date.now()
    };

    component.playTrack(entry);

    expect(mockPlayerService.play).not.toHaveBeenCalled();
  });

  it('should clear history', () => {
    component.clearHistory();
    expect(mockHistoryService.clearHistory).toHaveBeenCalled();
  });

  it('should format duration correctly', () => {
    expect(component.formatDuration(180)).toBe('3:00');
    expect(component.formatDuration(125)).toBe('2:05');
    expect(component.formatDuration(0)).toBe('0:00');
    expect(component.formatDuration(-5)).toBe('0:00');
  });

  it('should format date correctly', () => {
    const ts = new Date('2025-01-01T12:00:00Z').getTime();
    const formatted = component.formatDate(ts);
    expect(formatted).toBeTruthy();
    expect(typeof formatted).toBe('string');
  });
});
