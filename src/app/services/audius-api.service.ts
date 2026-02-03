import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import type { AudiusTrack, AudiusSearchResponse, AudiusStreamResponse } from '../models/audius.models';

const AUDIUS_APP_NAME = 'angular-music-player';

/** Audius API base (official public endpoint). */
const AUDIUS_API = 'https://api.audius.co';

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
    return this.http.get<AudiusSearchResponse>(`${AUDIUS_API}/v1/tracks/search`, { params }).pipe(
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
    return `${AUDIUS_API}/v1/tracks/${trackId}/stream?${params.toString()}`;
  }

  /** Get stream URL via API (may fail in browser due to CORS). Prefer getStreamEndpointUrl for playback. */
  getStreamUrl(trackId: string): Observable<string | null> {
    const params = new HttpParams()
      .set('app_name', AUDIUS_APP_NAME)
      .set('no_redirect', 'true');
    return this.http.get<AudiusStreamResponse>(`${AUDIUS_API}/v1/tracks/${trackId}/stream`, { params }).pipe(
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
