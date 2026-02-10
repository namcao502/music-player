import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import type { AudiusTrack, AudiusSearchResponse, AudiusStreamResponse } from '../models/audius.models';

const AUDIUS_APP_NAME = 'angular-music-player';

@Injectable({ providedIn: 'root' })
export class AudiusApiService {
  constructor(private http: HttpClient) {}

  searchTracks(query: string, limit = 20, offset = 0): Observable<AudiusTrack[]> {
    if (!query?.trim()) {
      return of([]);
    }
    const params = new HttpParams()
      .set('query', query.trim())
      .set('limit', String(limit))
      .set('offset', String(offset))
      .set('app_name', AUDIUS_APP_NAME);
    return this.http.get<AudiusSearchResponse>(`${environment.audiusApiUrl}/v1/tracks/search`, { params }).pipe(
      map((res) => res.data ?? []),
      catchError(() => of([]))
    );
  }

  /**
   * Returns the stream endpoint URL. Use this as the audio source directly:
   * the server will respond with a 302 redirect to the actual stream, and the
   * browser will follow it. This avoids CORS issues from pre-fetching the URL.
   */
  getStreamEndpointUrl(trackId: string): string {
    const params = new HttpParams().set('app_name', AUDIUS_APP_NAME);
    return `${environment.audiusApiUrl}/v1/tracks/${trackId}/stream?${params.toString()}`;
  }

  /** Get stream URL via API (may fail in browser due to CORS). Prefer getStreamEndpointUrl for playback. */
  getStreamUrl(trackId: string): Observable<string | null> {
    const params = new HttpParams()
      .set('app_name', AUDIUS_APP_NAME)
      .set('no_redirect', 'true');
    return this.http.get<AudiusStreamResponse>(`${environment.audiusApiUrl}/v1/tracks/${trackId}/stream`, { params }).pipe(
      map((res) => res.data ?? null),
      catchError(() => of(null))
    );
  }

  /** Fetch a single track by id (for playlists). */
  getTrackById(trackId: string): Observable<AudiusTrack | null> {
    if (!trackId?.trim()) return of(null);
    const params = new HttpParams().set('app_name', AUDIUS_APP_NAME);
    return this.http.get<{ data?: AudiusTrack } | AudiusTrack>(`${environment.audiusApiUrl}/v1/tracks/${trackId}`, { params }).pipe(
      map((res): AudiusTrack | null => {
        if (res && typeof res === 'object' && 'data' in res && res.data) return res.data as AudiusTrack;
        if (res && typeof res === 'object' && 'id' in res && typeof (res as AudiusTrack).id === 'string')
          return res as AudiusTrack;
        return null;
      }),
      catchError(() => of(null))
    );
  }

  getTrendingTracks(limit = 20, offset = 0): Observable<AudiusTrack[]> {
    const params = new HttpParams()
      .set('limit', String(limit))
      .set('offset', String(offset))
      .set('app_name', AUDIUS_APP_NAME);
    return this.http.get<{ data?: AudiusTrack[] }>(`${environment.audiusApiUrl}/v1/tracks/trending`, { params }).pipe(
      map((res) => res.data ?? []),
      catchError(() => of([]))
    );
  }

  getUserTracks(userId: string, limit = 20, offset = 0): Observable<AudiusTrack[]> {
    if (!userId?.trim()) return of([]);
    const params = new HttpParams()
      .set('limit', String(limit))
      .set('offset', String(offset))
      .set('app_name', AUDIUS_APP_NAME);
    return this.http.get<{ data?: AudiusTrack[] }>(`${environment.audiusApiUrl}/v1/users/${userId}/tracks`, { params }).pipe(
      map((res) => res.data ?? []),
      catchError(() => of([]))
    );
  }

  getUserById(userId: string): Observable<{ id: string; name: string; handle: string } | null> {
    if (!userId?.trim()) return of(null);
    const params = new HttpParams().set('app_name', AUDIUS_APP_NAME);
    return this.http.get<{ data?: { id: string; name: string; handle: string } }>(`${environment.audiusApiUrl}/v1/users/${userId}`, { params }).pipe(
      map((res) => res.data ?? null),
      catchError(() => of(null))
    );
  }

  /** Best available artwork URL for a track. */
  getArtworkUrl(track: AudiusTrack, size: keyof NonNullable<AudiusTrack['artwork']> = '480x480'): string {
    const art = track.artwork;
    if (!art) return '';
    return art[size] ?? art['480x480'] ?? art['150x150'] ?? art['1000x1000'] ?? '';
  }
}
