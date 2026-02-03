import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AudiusApiService } from './audius-api.service';
import type { AudiusTrack } from '../models/audius.models';

describe('AudiusApiService', () => {
  let service: AudiusApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AudiusApiService]
    });
    service = TestBed.inject(AudiusApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('A1: searchTracks with empty query returns empty array without HTTP', (done) => {
    service.searchTracks('').subscribe((data) => {
      expect(data).toEqual([]);
      done();
    });
  });

  it('A1b: searchTracks with whitespace-only query returns empty array', (done) => {
    service.searchTracks('   ').subscribe((data) => {
      expect(data).toEqual([]);
      done();
    });
  });

  it('A2: searchTracks sends GET with correct params', () => {
    service.searchTracks('test', 24).subscribe();
    const req = httpMock.expectOne((r) => r.url.includes('/v1/tracks/search'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('query')).toBe('test');
    expect(req.request.params.get('limit')).toBe('24');
    expect(req.request.params.get('app_name')).toBeTruthy();
    req.flush({ data: [] });
  });

  it('A3: searchTracks maps response.data to array', (done) => {
    const track: AudiusTrack = {
      id: '1',
      title: 'Track',
      duration: 120,
      user: { id: 'u1', name: 'Artist', handle: 'artist' }
    };
    service.searchTracks('q').subscribe((data) => {
      expect(data).toEqual([track]);
      done();
    });
    const req = httpMock.expectOne((r) => r.url.includes('/v1/tracks/search'));
    req.flush({ data: [track] });
  });

  it('A4: searchTracks on error returns empty array', (done) => {
    service.searchTracks('q').subscribe((data) => {
      expect(data).toEqual([]);
      done();
    });
    const req = httpMock.expectOne((r) => r.url.includes('/v1/tracks/search'));
    req.error(new ProgressEvent('error'));
  });

  it('A5: getStreamEndpointUrl returns URL with trackId and app_name', () => {
    const url = service.getStreamEndpointUrl('id1');
    expect(url).toContain('/v1/tracks/id1/stream');
    expect(url).toContain('app_name');
  });

  it('A6: getArtworkUrl returns size or fallback', () => {
    const track: AudiusTrack = {
      id: '1',
      title: 'T',
      duration: 0,
      artwork: { '480x480': 'https://img480', '150x150': 'https://img150' }
    };
    expect(service.getArtworkUrl(track, '480x480')).toBe('https://img480');
    expect(service.getArtworkUrl(track, '150x150')).toBe('https://img150');
    expect(service.getArtworkUrl({ ...track, artwork: {} })).toBe('');
  });
});
