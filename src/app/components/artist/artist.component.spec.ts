import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { ArtistComponent } from './artist.component';
import { AudiusApiService } from '../../services/audius-api.service';
import { PlayerService } from '../../services/player.service';
import { FavoritesService } from '../../services/favorites.service';
import { of, throwError } from 'rxjs';

describe('ArtistComponent', () => {
  let component: ArtistComponent;
  let fixture: ComponentFixture<ArtistComponent>;
  let mockActivatedRoute: jasmine.SpyObj<ActivatedRoute>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockAudiusService: jasmine.SpyObj<AudiusApiService>;
  let mockPlayerService: jasmine.SpyObj<PlayerService>;
  let mockFavoritesService: jasmine.SpyObj<FavoritesService>;

  beforeEach(async () => {
    mockActivatedRoute = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: { paramMap: { get: (key: string) => key === 'id' ? 'artist123' : null } }
    });
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockAudiusService = jasmine.createSpyObj('AudiusApiService', ['getUserById', 'getUserTracks', 'getArtworkUrl', 'getStreamEndpointUrl']);
    mockPlayerService = jasmine.createSpyObj('PlayerService', ['playQueue', 'togglePlayPause'], {
      nowPlaying: jasmine.createSpy('nowPlaying').and.returnValue(null)
    });
    mockFavoritesService = jasmine.createSpyObj('FavoritesService', ['toggle', 'isFavorite']);

    await TestBed.configureTestingModule({
      imports: [ArtistComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        { provide: AudiusApiService, useValue: mockAudiusService },
        { provide: PlayerService, useValue: mockPlayerService },
        { provide: FavoritesService, useValue: mockFavoritesService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ArtistComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load artist data on init', () => {
    const mockUser = { name: 'Artist Name', handle: 'artist_handle', id: 'artist123' };
    const mockTracks: any[] = [
      { id: 'track1', title: 'Track 1', duration: 180, user: { id: 'u1', name: 'Artist', handle: 'artist' } },
      { id: 'track2', title: 'Track 2', duration: 240, user: { id: 'u1', name: 'Artist', handle: 'artist' } }
    ];
    mockAudiusService.getUserById.and.returnValue(of(mockUser));
    mockAudiusService.getUserTracks.and.returnValue(of(mockTracks));

    component.ngOnInit();

    expect(component.loading()).toBeFalsy();
    expect(component.artistName()).toBe('Artist Name');
    expect(component.artistHandle()).toBe('artist_handle');
    expect(component.tracks().length).toBe(2);
  });

  it('should handle missing artist gracefully', () => {
    mockAudiusService.getUserById.and.returnValue(of(null));
    mockAudiusService.getUserTracks.and.returnValue(of([]));

    component.ngOnInit();

    expect(component.loading()).toBeFalsy();
    expect(component.artistName()).toBe('Unknown Artist');
    expect(component.artistHandle()).toBe('');
    expect(component.tracks().length).toBe(0);
  });

  it('should handle error loading artist', () => {
    mockAudiusService.getUserById.and.returnValue(throwError(() => new Error('API Error')));
    mockAudiusService.getUserTracks.and.returnValue(throwError(() => new Error('API Error')));

    component.ngOnInit();

    expect(component.loading()).toBeFalsy();
    expect(component.artistName()).toBe('Unknown Artist');
    expect(component.tracks().length).toBe(0);
  });

  it('should navigate back to free-music', () => {
    component.back();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/free-music']);
  });
});
