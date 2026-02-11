/** Stored playlist: name + list of Audius track IDs. */

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  /** Optional tags for categorizing playlists. */
  tags?: string[];
}

export const PLAYLISTS_STORAGE_KEY = 'music-player-playlists';

export const DEFAULT_TAG_COLORS: Record<string, string> = {
  Rock: '#e74c3c',
  Pop: '#3498db',
  Electronic: '#9b59b6',
  Chill: '#1abc9c',
  Workout: '#e67e22',
  Focus: '#f1c40f',
  Party: '#e91e63'
};
