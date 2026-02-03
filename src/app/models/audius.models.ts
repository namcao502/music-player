/** Audius API response types (free, non-copyright music) */

export interface AudiusArtwork {
  '150x150'?: string;
  '480x480'?: string;
  '1000x1000'?: string;
}

export interface AudiusUser {
  id: string;
  name: string;
  handle: string;
  [key: string]: unknown;
}

export interface AudiusTrack {
  id: string;
  title: string;
  duration: number;
  artwork?: AudiusArtwork;
  user?: AudiusUser;
  genre?: string;
  mood?: string;
  play_count?: number;
  is_streamable?: boolean;
  [key: string]: unknown;
}

export interface AudiusSearchResponse {
  data?: AudiusTrack[];
}

export interface AudiusStreamResponse {
  data?: string;
}
