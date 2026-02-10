import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FavoritesComponent } from './favorites.component';
import { FavoritesService } from '../../services/favorites.service';
import { AudiusApiService } from '../../services/audius-api.service';
import { PlayerService } from '../../services/player.service';
import { of, throwError } from 'rxjs';

describe('FavoritesComponent', () => {
  let component: FavoritesComponent;
  let fixture: ComponentFixture<FavoritesComponent>;
  let mockFavoritesService: jasmine.SpyObj<FavoritesService>;
  let mockAudiusService: jasmine.SpyObj<AudiusApiService>;
  let mockPlayerService: jasmine.SpyObj<PlayerService>;

  beforeEach(async () => {
    mockFavoritesService = jasmine.createSpyObj('FavoritesService', ['remove', 'isFavorite'], {
      favoriteIds: jasmine.createSpy('favoriteIds').and.returnValue(['track1', 'track2'])
    });
    mockAudiusService = jasmine.createSpyObj('AudiusApiService', ['getTrackById', 'getArtworkUrl', 'getStreamEndpointUrl']);
    mockPlayerService = jasmine.createSpyObj('PlayerService', ['play', 'playQueue', 'togglePlayPause'], {
      nowPlaying: jasmine.createSpy('nowPlaying').and.returnValue(null)
    });

    await TestBed.configureTestingModule({
      imports: [FavoritesComponent],
      providers: [
        { provide: FavoritesService, useValue: mockFavoritesService },
        { provide: AudiusApiService, useValue: mockAudiusService },
        { provide: PlayerService, useValue: mockPlayerService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FavoritesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load favorite tracks on init', () => {
    const mockTracks: any[] = [
      { id: 'track1', title: 'Track 1', duration: 180, user: { id: 'u1', name: 'Artist 1', handle: 'artist1' } },
      { id: 'track2', title: 'Track 2', duration: 240, user: { id: 'u2', name: 'Artist 2', handle: 'artist2' } }
    ];
    mockAudiusService.getTrackById.and.returnValues(of(mockTracks[0]), of(mockTracks[1]));

    component.ngOnInit();

    expect(component.loading()).toBeFalsy();
    expect(component.tracks().length).toBe(2);
  });

  it('should handle error when loading favorites', () => {
    mockAudiusService.getTrackById.and.returnValue(throwError(() => new Error('API Error')));

    component.ngOnInit();

    expect(component.loading()).toBeFalsy();
    expect(component.tracks().length).toBe(0);
  });

  it('should remove favorite track', () => {
    component.tracks.set([
      { id: 'track1', title: 'Track 1', duration: 180, user: { id: 'u1', name: 'Artist 1', handle: 'artist1' } },
      { id: 'track2', title: 'Track 2', duration: 240, user: { id: 'u2', name: 'Artist 2', handle: 'artist2' } }
    ] as any);

    const event = new Event('click');
    spyOn(event, 'stopPropagation');

    component.removeFavorite('track1', event);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(mockFavoritesService.remove).toHaveBeenCalledWith('track1');
    expect(component.tracks().length).toBe(1);
  });
});
