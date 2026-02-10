import { AudiusApiService } from '../audius-api.service';
import { PlayerService, type PlayableTrack } from '../player.service';
import type { AudiusTrack } from '../../models/audius.models';

/**
 * Build a playable queue from Audius tracks.
 * Maps each track to a PlayableTrack with stream URL and artwork.
 */
export function buildPlayableQueue(audius: AudiusApiService, tracks: AudiusTrack[]): PlayableTrack[] {
  return tracks.map((t) => ({
    id: t.id,
    title: t.title,
    artist: t.user?.name,
    duration: t.duration,
    coverArtUrl: audius.getArtworkUrl(t),
    streamUrl: audius.getStreamEndpointUrl(t.id)
  }));
}

/**
 * Get preferred artwork URL with fallback from 480x480 to 150x150.
 */
export function getPreferredArtworkUrl(audius: AudiusApiService, track: AudiusTrack): string {
  return audius.getArtworkUrl(track, '480x480') || audius.getArtworkUrl(track, '150x150');
}
