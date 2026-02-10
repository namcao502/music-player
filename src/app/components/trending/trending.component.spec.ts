import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterLink } from '@angular/router';
import { TrendingComponent } from './trending.component';
import { AudiusApiService } from '../../services/audius-api.service';
import { PlayerService } from '../../services/player.service';
import { FavoritesService } from '../../services/favorites.service';
import { of, throwError } from 'rxjs';

describe('TrendingComponent', () => {
  let component: TrendingComponent;
  let fixture: ComponentFixture<TrendingComponent>;
  let mockAudiusService: jasmine.SpyObj<AudiusApiService>;
  let mockPlayerService: jasmine.SpyObj<PlayerService>;
  let mockFavoritesService: jasmine.SpyObj<FavoritesService>;

  beforeEach(async () => {
    mockAudiusService = jasmine.createSpyObj('AudiusApiService', ['getTrendingTracks', 'getArtworkUrl', 'getStreamEndpointUrl']);
    mockPlayerService = jasmine.createSpyObj('PlayerService', ['playQueue', 'togglePlayPause'], {
      nowPlaying: jasmine.createSpy('nowPlaying').and.returnValue(null)
    });
    mockFavoritesService = jasmine.createSpyObj('FavoritesService', ['toggle', 'isFavorite']);

    await TestBed.configureTestingModule({
      imports: [TrendingComponent, RouterLink],
      providers: [
        { provide: AudiusApiService, useValue: mockAudiusService },
        { provide: PlayerService, useValue: mockPlayerService },
        { provide: FavoritesService, useValue: mockFavoritesService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TrendingComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load trending tracks on init', () => {
    const mockTracks: any[] = [
      { id: 'track1', title: 'Track 1', duration: 180, user: { id: 'u1', name: 'Artist 1', handle: 'artist1' } },
      { id: 'track2', title: 'Track 2', duration: 240, user: { id: 'u2', name: 'Artist 2', handle: 'artist2' } }
    ];
    mockAudiusService.getTrendingTracks.and.returnValue(of(mockTracks));

    component.ngOnInit();

    expect(component.loading()).toBeFalsy();
    expect(component.tracks().length).toBe(2);
    expect(component.error()).toBeNull();
  });

  it('should handle error when loading trending tracks', () => {
    mockAudiusService.getTrendingTracks.and.returnValue(throwError(() => new Error('API Error')));

    component.ngOnInit();

    expect(component.loading()).toBeFalsy();
    expect(component.error()).toBe('Failed to load trending tracks. Please try again.');
  });

  it('should toggle favorite', () => {
    const event = new Event('click');
    spyOn(event, 'stopPropagation');

    component.toggleFavorite('track1', event);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(mockFavoritesService.toggle).toHaveBeenCalledWith('track1');
  });

  it('should format duration correctly', () => {
    expect(component.formatDuration(180)).toBe('3:00');
    expect(component.formatDuration(125)).toBe('2:05');
    expect(component.formatDuration(-5)).toBe('0:00');
    expect(component.formatDuration(NaN)).toBe('0:00');
  });
});
